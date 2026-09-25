import { z } from "zod";
import { generateHTML } from "@/lib/ai";
import { BriefSchema, briefToText } from "@/lib/brief";
import { AI_IMAGE_INSTRUCTIONS, fillAiImages, uploadDataUrl } from "@/lib/images";
import { COSTS, MAX_AUTO_IMAGES } from "@/lib/plans";
import { handler } from "@/lib/route";
import { runVariants } from "@/lib/variants";

export const maxDuration = 300;

const Input = z.object({
  brief: BriefSchema,
  framework: z.enum(["PAS", "AIDA", "Storytelling (Hero's journey)"]).default("PAS"),
  bonuses: z.string().max(1000).default(""),
  guarantee: z.string().max(300).default(""),
  checkoutUrl: z.string().max(500).default("#"),
  coverImage: z.string().max(2_000_000).optional(),
  variants: z.union([z.literal(1), z.literal(3)]).default(1),
  aiImages: z.boolean().default(false),
});

const unitCost = (aiImages: boolean) => COSTS["sales-page"] + (aiImages ? MAX_AUTO_IMAGES * COSTS.image : 0);

export const POST = handler(
  Input,
  async ({ brief, framework, bonuses, guarantee, checkoutUrl, coverImage: cover, variants, aiImages }, ctx) => {
    // Le mockup est hébergé une fois pour toutes (page plus légère, utilisable une fois publiée).
    const coverImage = cover?.startsWith("data:") ? await uploadDataUrl(ctx.user.id, cover) : cover;
    const htmls = await runVariants(variants, unitCost(aiImages), ctx, async (direction) => {
      let html = await generateHTML(
        "Tu es un copywriter direct-response et un designer de landing pages à haute conversion " +
          "pour des produits digitaux (ebooks, formations, templates). Structure : hero avec promesse forte " +
          "et bouton d'achat, problème, agitation, solution, contenu du produit, bénéfices, pour qui / pas pour qui, " +
          "témoignages (marqués comme exemples à remplacer), bonus, garantie, prix avec ancrage, FAQ, " +
          "dernier appel à l'action. Design moderne, responsive, boutons visibles et répétés." +
          (aiImages ? "\n\n" + AI_IMAGE_INSTRUCTIONS : ""),
        `Crée la page de vente avec le framework ${framework}.\n\n${briefToText(brief)}\n` +
          (bonuses ? `Bonus : ${bonuses}\n` : "") +
          (guarantee ? `Garantie : ${guarantee}\n` : "") +
          `Tous les boutons d'achat pointent vers : ${checkoutUrl}\n` +
          (coverImage ? "Place l'image du produit (mockup) dans le hero avec exactement src=\"{{COVER_IMAGE}}\".\n" : "") +
          (direction ? `\n${direction}\n` : ""),
      );
      if (coverImage) html = html.replaceAll("{{COVER_IMAGE}}", coverImage);
      if (!aiImages) return html;
      const filled = await fillAiImages(ctx.user.id, html);
      await ctx.refund(filled.failed * COSTS.image);
      return filled.html;
    });
    return { html: htmls[0], variants: htmls };
  },
  {
    cost: ({ variants, aiImages }) => ({ kind: "sales-page", amount: unitCost(aiImages) * variants }),
    save: ({ brief }, { html, variants }) => ({
      type: "sales-page",
      title: `Page de vente — ${brief.name || "produit"}`,
      data: { html, variants },
    }),
  },
);
