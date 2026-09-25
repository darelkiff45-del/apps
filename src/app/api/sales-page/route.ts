import { z } from "zod";
import { generateHTML } from "@/lib/ai";
import { BriefSchema, briefToText } from "@/lib/brief";
import { handler } from "@/lib/route";

export const maxDuration = 300;

const Input = z.object({
  brief: BriefSchema,
  framework: z.enum(["PAS", "AIDA", "Storytelling (Hero's journey)"]).default("PAS"),
  bonuses: z.string().max(1000).default(""),
  guarantee: z.string().max(300).default(""),
  checkoutUrl: z.string().max(500).default("#"),
  coverImage: z.string().max(2_000_000).optional(),
});

export const POST = handler(Input, async ({ brief, framework, bonuses, guarantee, checkoutUrl, coverImage }) => {
  let html = await generateHTML(
    "Tu es un copywriter direct-response et un designer de landing pages à haute conversion " +
      "pour des produits digitaux (ebooks, formations, templates). Structure : hero avec promesse forte " +
      "et bouton d'achat, problème, agitation, solution, contenu du produit, bénéfices, pour qui / pas pour qui, " +
      "témoignages (marqués comme exemples à remplacer), bonus, garantie, prix avec ancrage, FAQ, " +
      "dernier appel à l'action. Design moderne, responsive, boutons visibles et répétés.",
    `Crée la page de vente avec le framework ${framework}.\n\n${briefToText(brief)}\n` +
      (bonuses ? `Bonus : ${bonuses}\n` : "") +
      (guarantee ? `Garantie : ${guarantee}\n` : "") +
      `Tous les boutons d'achat pointent vers : ${checkoutUrl}\n` +
      (coverImage
        ? "Place l'image du produit (mockup) dans le hero avec exactement src=\"{{COVER_IMAGE}}\".\n"
        : ""),
  );
  if (coverImage) html = html.replaceAll("{{COVER_IMAGE}}", coverImage);
  return { html };
});
