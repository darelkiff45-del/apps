import { z } from "zod";
import { generateJSON } from "@/lib/ai";
import { BriefSchema, briefToText } from "@/lib/brief";
import { generateImage } from "@/lib/images";
import { COSTS } from "@/lib/plans";
import { handler } from "@/lib/route";

export const maxDuration = 180;

const Input = z.object({
  brief: BriefSchema,
  productType: z.string().max(100).default("ebook"),
  variants: z.union([z.literal(1), z.literal(3)]).default(1),
  aiImage: z.boolean().default(false),
});

const CoverDesign = z.object({
  title: z.string(),
  subtitle: z.string(),
  badge: z.string(),
  author: z.string(),
  background: z.string(),
  backgroundEnd: z.string(),
  accent: z.string(),
  text: z.string(),
  pattern: z.enum(["none", "dots", "grid", "waves", "circles"]),
  fontFamily: z.enum(["Poppins", "Playfair Display", "Montserrat", "Bebas Neue", "Lora"]),
  headlines: z.array(z.string()),
  imagePrompt: z.string(),
});

export type CoverDesignResult = z.infer<typeof CoverDesign> & { image?: string };

const Designs = z.object({ designs: z.array(CoverDesign) });

// 3 couvertures sont produites en un seul appel : elles coûtent 2 crédits au lieu de 3.
const textCost = (variants: number) => (variants === 3 ? 2 : 1) * COSTS.mockup;

export const POST = handler(
  Input,
  async ({ brief, productType, variants, aiImage }, ctx) => {
    const { designs } = await generateJSON(
      Designs,
      "Tu es directeur artistique spécialisé en couvertures de produits digitaux qui se vendent. " +
        "Les couleurs sont des codes hexadécimaux (#RRGGBB) avec un contraste texte/fond fort. " +
        "Le titre fait au maximum 6 mots, le badge 3 mots (ex. « Guide complet », « Édition 2026 »). " +
        "headlines = 3 accroches publicitaires courtes pour afficher sur les visuels promo. " +
        "imagePrompt = prompt EN ANGLAIS pour une illustration de couverture (sujet, style, lumière), sans aucun texte.",
      `Conçois ${variants} couverture(s) ${variants > 1 ? "très différentes les unes des autres (palettes, polices, ambiances) " : ""}` +
        `pour un produit de type « ${productType} ».\n\n${briefToText(brief)}`,
      "low",
    );
    const list: CoverDesignResult[] = designs.slice(0, variants);
    if (!list.length) throw new Error("Aucune couverture générée.");

    if (aiImage) {
      const images = await Promise.allSettled(list.map((d) => generateImage(ctx.user.id, d.imagePrompt, "portrait_4_3")));
      images.forEach((r, i) => r.status === "fulfilled" && (list[i].image = r.value));
      const failed = images.filter((r) => r.status === "rejected").length + (variants - list.length);
      await ctx.refund(failed * COSTS.image);
    }
    return { design: list[0], variants: list };
  },
  {
    cost: ({ variants, aiImage }) => ({ kind: "mockup", amount: textCost(variants) + (aiImage ? variants * COSTS.image : 0) }),
    save: (_, { design, variants }) => ({ type: "mockup", title: design.title, data: { ...design, variants } }),
  },
);
