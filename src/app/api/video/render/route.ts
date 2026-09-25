import { z } from "zod";
import { requireVideoPlan } from "@/lib/account";
import { AIError } from "@/lib/ai";
import { hfAnimate, hfSpeak } from "@/lib/higgsfield";
import { generateImage, uploadDataUrl, type ImageSize } from "@/lib/images";
import { COSTS } from "@/lib/plans";
import { handler } from "@/lib/route";

export const maxDuration = 300;

const Url = z.string().url().startsWith("https://").max(2000);
const DataUrl = z.string().regex(/^data:image\/(png|jpeg|webp);base64,/).max(8_000_000);

const Scene = z.object({
  mode: z.enum(["animate", "speak"]),
  label: z.string().max(100).default(""),
  voiceover: z.string().max(2000).default(""),
  onScreenText: z.string().max(300).default(""),
  imagePrompt: z.string().max(1500).default(""),
  motionPrompt: z.string().max(1000).default(""),
  useProduct: z.boolean().default(false),
  audioUrl: Url.optional(),
  audioSeconds: z.number().min(0.5).max(60).optional(),
});

const Input = z.object({
  title: z.string().max(200).default("Vidéo pub"),
  script: z.unknown().optional(),
  format: z.enum(["vertical", "square", "horizontal"]).default("vertical"),
  productImage: z.union([Url, DataUrl]).optional(), // mockup du produit
  avatarImage: z.union([Url, DataUrl]).optional(), // visage de l'avatar parlant
  scenes: z.array(Scene).min(1).max(8),
});

const SIZES: Record<"vertical" | "square" | "horizontal", ImageSize> = {
  vertical: "portrait_16_9",
  square: "square_hd",
  horizontal: "landscape_16_9",
};

export type RenderedScene = {
  mode: "animate" | "speak";
  label: string;
  voiceover: string;
  onScreenText: string;
  imageUrl?: string;
  requestId?: string;
  status: "queued" | "in_progress" | "completed" | "failed" | "nsfw";
  storagePath?: string;
  refunded?: boolean;
  error?: string;
};

/** Lance la production : une image + une animation (DoP) ou un avatar parlant (Speak) par scène. */
export const POST = handler(
  Input,
  async ({ format, productImage, avatarImage, scenes }, ctx) => {
    const uid = ctx.user.id;
    await requireVideoPlan(uid);

    const toPublic = async (img?: string) => (img?.startsWith("data:") ? uploadDataUrl(uid, img) : img);
    const [productUrl, avatarUrl] = await Promise.all([toPublic(productImage), toPublic(avatarImage)]);
    if (scenes.some((s) => s.mode === "speak") && !avatarUrl) {
      throw new AIError("Choisis ou génère le visage de l'avatar pour les scènes parlées.", 400);
    }

    const results = await Promise.allSettled(
      scenes.map(async (s): Promise<RenderedScene> => {
        const base = { mode: s.mode, label: s.label, voiceover: s.voiceover, onScreenText: s.onScreenText };
        if (s.mode === "speak") {
          if (!s.audioUrl) throw new AIError("Enregistre la voix de chaque scène parlée.", 400);
          const secs = s.audioSeconds || 10;
          const duration = secs <= 5 ? 5 : secs <= 10 ? 10 : 15;
          const requestId = await hfSpeak(avatarUrl!, s.audioUrl, s.motionPrompt || "Natural, friendly UGC testimonial, looking at camera", duration);
          return { ...base, imageUrl: avatarUrl, requestId, status: "queued" };
        }
        const imageUrl = s.useProduct && productUrl ? productUrl : await generateImage(uid, s.imagePrompt || s.label, SIZES[format]);
        const requestId = await hfAnimate(imageUrl, s.motionPrompt || "Slow cinematic camera movement");
        return { ...base, imageUrl, requestId, status: "queued" };
      }),
    );

    const rendered: RenderedScene[] = results.map((r, i) =>
      r.status === "fulfilled"
        ? r.value
        : {
            mode: scenes[i].mode,
            label: scenes[i].label,
            voiceover: scenes[i].voiceover,
            onScreenText: scenes[i].onScreenText,
            status: "failed",
            refunded: true,
            error: r.reason instanceof Error ? r.reason.message : "Échec",
          },
    );
    const failed = rendered.filter((s) => s.status === "failed").length;
    if (failed === rendered.length) {
      const first = results[0];
      throw first.status === "rejected" ? first.reason : new AIError("Production impossible.", 502);
    }
    await ctx.refund(failed * COSTS["video-render"]);
    return { scenes: rendered };
  },
  {
    cost: ({ scenes }) => ({ kind: "video-render", amount: scenes.length * COSTS["video-render"] }),
    save: ({ title, script, format }, { scenes }) => ({ type: "video", title, data: { script, format, scenes } }),
  },
);
