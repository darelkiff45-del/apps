import { z } from "zod";
import { generateJSON } from "@/lib/ai";
import { BriefSchema, briefToText } from "@/lib/brief";
import { VIDEO_STYLES } from "@/lib/constants";
import { handler } from "@/lib/route";

export const maxDuration = 180;

const Input = z.object({
  brief: BriefSchema,
  style: z.enum(Object.keys(VIDEO_STYLES) as [keyof typeof VIDEO_STYLES]),
  duration: z.number().int().min(15).max(120).default(30),
  platform: z.string().max(50).default("TikTok / Instagram Reels"),
});

const Script = z.object({
  title: z.string(),
  hooks: z.array(z.string()),
  scenes: z.array(
    z.object({
      label: z.string(),
      voiceover: z.string(),
      onScreenText: z.string(),
      visual: z.string(),
      background: z.string(),
    }),
  ),
  caption: z.string(),
  hashtags: z.array(z.string()),
});

export type VideoScriptResult = z.infer<typeof Script>;

export const POST = handler(Input, async ({ brief, style, duration, platform }) => {
  return generateJSON(
    Script,
    "Tu es un créateur de publicités vidéo performantes pour les réseaux sociaux (UGC, storytelling). " +
      "Tu écris comme on parle : phrases courtes, naturelles, émotion, pas de jargon marketing. " +
      "La première scène commence par le meilleur hook (arrêter le scroll en 2 secondes). " +
      "La dernière scène est un appel à l'action clair. " +
      "voiceover = texte exact prononcé par l'avatar ; visual = description du plan / B-roll ; " +
      "background = couleur hexadécimale (#RRGGBB) du fond pour cette scène ; " +
      "hooks = 3 variantes de hook alternatives pour tester (A/B).",
    `Écris le script d'une vidéo pub de style « ${VIDEO_STYLES[style]} » pour ${platform}, ` +
      `d'environ ${duration} secondes (≈ ${Math.round(duration * 2.5)} mots au total), en 3 à 7 scènes.\n\n` +
      briefToText(brief),
    "medium",
  );
}, { cost: "video-script" });
