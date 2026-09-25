import { z } from "zod";
import { generateJSON } from "@/lib/ai";
import { BriefSchema, briefToText } from "@/lib/brief";
import { handler } from "@/lib/route";

export const maxDuration = 300;

const Input = z.object({
  brief: BriefSchema,
  chapters: z.number().int().min(3).max(12).default(6),
  length: z.enum(["court", "moyen", "long"]).default("moyen"),
});

const Ebook = z.object({
  title: z.string(),
  subtitle: z.string(),
  introduction: z.string(),
  chapters: z.array(
    z.object({
      title: z.string(),
      content: z.string(),
      keyTakeaways: z.array(z.string()),
      actionStep: z.string(),
    }),
  ),
  conclusion: z.string(),
  callToAction: z.string(),
});

export type EbookResult = z.infer<typeof Ebook>;

const WORDS = { court: 300, moyen: 700, long: 1200 };

export const POST = handler(Input, async ({ brief, chapters, length }) => {
  return generateJSON(
    Ebook,
    "Tu es un auteur professionnel d'ebooks à forte valeur perçue, vendus comme produits digitaux. " +
      "Tu écris un contenu concret, actionnable, structuré, avec des exemples réels, sans remplissage. " +
      "Le contenu des chapitres, l'introduction et la conclusion sont en Markdown (sous-titres ###, listes, **gras**).",
    `Écris un ebook complet de ${chapters} chapitres (environ ${WORDS[length]} mots par chapitre).\n\n` +
      briefToText(brief) +
      "\n\nChaque chapitre se termine par des points clés et une action concrète. " +
      "L'appel à l'action final invite le lecteur à passer à l'étape suivante avec le créateur.",
    "medium",
  );
}, {
  cost: "ebook",
  save: (_, ebook) => ({ type: "ebook", title: ebook.title, data: ebook }),
});
