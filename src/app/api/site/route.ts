import { z } from "zod";
import { generateHTML } from "@/lib/ai";
import { BriefSchema, briefToText } from "@/lib/brief";
import { AI_IMAGE_INSTRUCTIONS, fillAiImages } from "@/lib/images";
import { COSTS, MAX_AUTO_IMAGES } from "@/lib/plans";
import { handler } from "@/lib/route";
import { runVariants } from "@/lib/variants";

export const maxDuration = 300;

const Input = z.object({
  brief: BriefSchema,
  business: z.string().max(500).default(""),
  sections: z.array(z.string().max(60)).max(12).default([]),
  style: z.string().max(200).default("moderne et épuré"),
  contact: z.string().max(300).default(""),
  variants: z.union([z.literal(1), z.literal(3)]).default(1),
  aiImages: z.boolean().default(false),
});

const unitCost = (aiImages: boolean) => COSTS.site + (aiImages ? MAX_AUTO_IMAGES * COSTS.image : 0);

export const POST = handler(
  Input,
  async ({ brief, business, sections, style, contact, variants, aiImages }, ctx) => {
    const htmls = await runVariants(variants, unitCost(aiImages), ctx, async (direction) => {
      const html = await generateHTML(
        "Tu es un web designer senior. Tu crées des sites vitrines one-page modernes, responsives " +
          "(mobile d'abord), rapides, avec une navigation ancrée, une hiérarchie visuelle claire, " +
          "des animations CSS discrètes et un design digne d'une agence." +
          (aiImages ? "\n\n" + AI_IMAGE_INSTRUCTIONS : ""),
        `Crée le site vitrine de cette activité.\n\n${briefToText(brief)}\n` +
          (business ? `Activité : ${business}\n` : "") +
          `Style visuel : ${style}\n` +
          `Sections : ${sections.length ? sections.join(", ") : "Accueil, À propos, Services/Produits, Témoignages, FAQ, Contact"}\n` +
          (contact ? `Coordonnées : ${contact}\n` : "") +
          (direction ? `\n${direction}\n` : ""),
      );
      if (!aiImages) return html;
      const filled = await fillAiImages(ctx.user.id, html);
      await ctx.refund(filled.failed * COSTS.image);
      return filled.html;
    });
    return { html: htmls[0], variants: htmls };
  },
  {
    cost: ({ variants, aiImages }) => ({ kind: "site", amount: unitCost(aiImages) * variants }),
    save: ({ business, brief }, { html, variants }) => ({ type: "site", title: business || brief.name || "Site vitrine", data: { html, variants } }),
  },
);
