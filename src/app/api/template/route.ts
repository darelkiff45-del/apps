import { z } from "zod";
import { generateHTML } from "@/lib/ai";
import { BriefSchema, briefToText } from "@/lib/brief";
import { TEMPLATE_KINDS } from "@/lib/constants";
import { handler } from "@/lib/route";

export const maxDuration = 300;


const Input = z.object({
  brief: BriefSchema,
  kind: z.enum(TEMPLATE_KINDS),
  pages: z.number().int().min(1).max(8).default(3),
  details: z.string().max(1000).default(""),
});

export const POST = handler(Input, async ({ brief, kind, pages, details }) => {
  const html = await generateHTML(
    "Tu es designer de templates imprimables vendus sur Etsy, Gumroad et Chariow. " +
      "Tu crées des templates élégants, modernes, cohérents, prêts à imprimer en A4 : " +
      "chaque page est une <section class=\"page\"> de 210mm x 297mm avec page-break-after, " +
      "marges généreuses, zones à remplir (lignes, cases à cocher, tableaux), typographie soignée.",
    `Crée un template de type « ${kind} » de ${pages} page(s).\n\n${briefToText(brief)}` +
      (details ? `\n\nPrécisions du créateur : ${details}` : ""),
  );
  return { html };
}, {
  cost: "template",
  save: ({ kind, brief }, { html }) => ({ type: "template", title: `${kind} — ${brief.name || brief.niche || "sans nom"}`, data: { html } }),
});
