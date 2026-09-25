import { z } from "zod";
import { requireVideoPlan } from "@/lib/account";
import { createVideo } from "@/lib/heygen";
import { handler } from "@/lib/route";

const Input = z.object({
  title: z.string().max(200).default("Vidéo pub"),
  avatarId: z.string().min(1),
  voiceId: z.string().min(1),
  format: z.enum(["vertical", "square", "horizontal"]).default("vertical"),
  captions: z.boolean().default(true),
  scenes: z
    .array(
      z.object({
        voiceover: z.string().min(1).max(1500),
        background: z.string().regex(/^#[0-9a-fA-F]{6}$/).catch("#111827"),
      }),
    )
    .min(1)
    .max(20),
  script: z.unknown().optional(),
});

export const POST = handler(
  Input,
  async (data, { user }) => {
    await requireVideoPlan(user.id);
    return { videoId: await createVideo(data) };
  },
  {
    cost: "video-render",
    save: ({ title, script, format }, { videoId }) => ({
      type: "video",
      title,
      data: { script, videoId, format, status: "pending" },
    }),
  },
);
