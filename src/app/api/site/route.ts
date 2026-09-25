import { z } from "zod";
import { generateHTML } from "@/lib/ai";
import { BriefSchema, briefToText } from "@/lib/brief";
import { handler } from "@/lib/route";

export const maxDuration = 300;

const Input = z.object({
  brief: BriefSchema,
  business: z.string().max(500).default(""),
  sections: z.array(z.string().max(60)).max(12).default([]),
  style: z.string().max(200).default("moderne et épuré"),
  contact: z.string().max(300).default(""),
});

export const POST = handler(Input, async ({ brief, business, sections, style, contact }) => {
  const html = await generateHTML(
    "Tu es un web designer senior. Tu crées des sites vitrines one-page modernes, responsives " +
      "(mobile d'abord), rapides, avec une navigation ancrée, une hiérarchie visuelle claire, " +
      "des animations CSS discrètes et un design digne d'une agence.",
    `Crée le site vitrine de cette activité.\n\n${briefToText(brief)}\n` +
      (business ? `Activité : ${business}\n` : "") +
      `Style visuel : ${style}\n` +
      `Sections : ${sections.length ? sections.join(", ") : "Accueil, À propos, Services/Produits, Témoignages, FAQ, Contact"}\n` +
      (contact ? `Coordonnées : ${contact}\n` : ""),
  );
  return { html };
}, {
  cost: "site",
  save: ({ business, brief }, { html }) => ({ type: "site", title: business || brief.name || "Site vitrine", data: { html } }),
});
