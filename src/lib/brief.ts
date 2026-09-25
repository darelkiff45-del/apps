import { z } from "zod";

/** Fiche produit partagée par tous les modules (ebook, page de vente, vidéos…). */
export const BriefSchema = z.object({
  name: z.string().max(200).default(""),
  niche: z.string().max(300).default(""),
  audience: z.string().max(500).default(""),
  promise: z.string().max(500).default(""),
  price: z.string().max(50).default(""),
  tone: z.string().max(100).default("inspirant et direct"),
  language: z.string().max(50).default("français"),
});

export type Brief = z.infer<typeof BriefSchema>;

export const emptyBrief: Brief = {
  name: "",
  niche: "",
  audience: "",
  promise: "",
  price: "",
  tone: "inspirant et direct",
  language: "français",
};

export function briefToText(b: Brief) {
  return [
    b.name && `Nom du produit : ${b.name}`,
    b.niche && `Niche / sujet : ${b.niche}`,
    b.audience && `Client idéal : ${b.audience}`,
    b.promise && `Promesse / transformation : ${b.promise}`,
    b.price && `Prix : ${b.price}`,
    `Ton : ${b.tone || "inspirant et direct"}`,
    `Langue de rédaction : ${b.language || "français"}`,
  ]
    .filter(Boolean)
    .join("\n");
}
