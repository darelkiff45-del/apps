import { z } from "zod";
import { generateHTML } from "@/lib/ai";
import { BriefSchema, briefToText } from "@/lib/brief";
import { TEMPLATE_KINDS } from "@/lib/constants";
import { COSTS } from "@/lib/plans";
import { handler } from "@/lib/route";
import { runVariants } from "@/lib/variants";

export const maxDuration = 300;


const Input = z.object({
  brief: BriefSchema,
  kind: z.enum(TEMPLATE_KINDS),
  pages: z.number().int().min(1).max(8).default(3),
  details: z.string().max(1000).default(""),
  variants: z.union([z.literal(1), z.literal(3)]).default(1),
});

export const POST = handler(Input, async ({ brief, kind, pages, details, variants }, ctx) => {
  const htmls = await runVariants(variants, COSTS.template, ctx, (direction) => generateHTML(
    "Tu es designer de templates imprimables vendus sur Etsy, Gumroad et Chariow. " +
      "Tu crées des templates élégants, modernes, cohérents, prêts à imprimer en A4 : " +
      "chaque page est une <section class=\"page\"> de 210mm x 297mm avec page-break-after, " +
      "marges généreuses, zones à remplir (lignes, cases à cocher, tableaux), typographie soignée.",
    `Crée un template de type « ${kind} » de ${pages} page(s).\n\n${briefToText(brief)}` +
      (details ? `\n\nPrécisions du créateur : ${details}` : "") +
      (direction ? `\n\n${direction}` : ""),
  ));
  return { html: htmls[0], variants: htmls };
}, {
  cost: ({ variants }) => ({ kind: "template", amount: COSTS.template * variants }),
  save: ({ kind, brief }, { html, variants }) => ({ type: "template", title: `${kind} — ${brief.name || brief.niche || "sans nom"}`, data: { html, variants } }),
});
