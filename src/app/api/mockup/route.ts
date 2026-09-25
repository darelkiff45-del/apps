import { z } from "zod";
import { generateJSON } from "@/lib/ai";
import { BriefSchema, briefToText } from "@/lib/brief";
import { handler } from "@/lib/route";

export const maxDuration = 120;

const Input = z.object({
  brief: BriefSchema,
  productType: z.string().max(100).default("ebook"),
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
});

export type CoverDesignResult = z.infer<typeof CoverDesign>;

export const POST = handler(Input, async ({ brief, productType }) => {
  return generateJSON(
    CoverDesign,
    "Tu es directeur artistique spécialisé en couvertures de produits digitaux qui se vendent. " +
      "Les couleurs sont des codes hexadécimaux (#RRGGBB) avec un contraste texte/fond fort. " +
      "Le titre fait au maximum 6 mots, le badge 3 mots (ex. « Guide complet », « Édition 2026 »). " +
      "headlines = 3 accroches publicitaires courtes pour afficher sur les visuels promo.",
    `Conçois la couverture d'un produit de type « ${productType} ».\n\n${briefToText(brief)}`,
    "low",
  );
}, {
  cost: "mockup",
  save: (_, design) => ({ type: "mockup", title: design.title, data: design }),
});
