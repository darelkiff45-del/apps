import { z } from "zod";
import { generateJSON } from "@/lib/ai";
import { BriefSchema, briefToText } from "@/lib/brief";
import { VIDEO_STYLES } from "@/lib/constants";
import { COSTS } from "@/lib/plans";
import { handler } from "@/lib/route";
import { runVariants } from "@/lib/variants";

export const maxDuration = 180;

const Input = z.object({
  brief: BriefSchema,
  style: z.enum(Object.keys(VIDEO_STYLES) as [keyof typeof VIDEO_STYLES]),
  duration: z.number().int().min(15).max(120).default(30),
  platform: z.string().max(50).default("TikTok / Instagram Reels"),
  variants: z.union([z.literal(1), z.literal(3)]).default(1),
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
      imagePrompt: z.string(),
      motionPrompt: z.string(),
    }),
  ),
  caption: z.string(),
  hashtags: z.array(z.string()),
});

export type VideoScriptResult = z.infer<typeof Script>;

export const POST = handler(Input, async ({ brief, style, duration, platform, variants }, ctx) => {
  const scripts = await runVariants(variants, COSTS["video-script"], ctx, (direction) => generateJSON(
    Script,
    "Tu es un créateur de publicités vidéo performantes pour les réseaux sociaux (UGC, storytelling). " +
      "Tu écris comme on parle : phrases courtes, naturelles, émotion, pas de jargon marketing. " +
      "La première scène commence par le meilleur hook (arrêter le scroll en 2 secondes). " +
      "La dernière scène est un appel à l'action clair. " +
      "voiceover = texte exact prononcé par l'avatar ; visual = description du plan / B-roll ; " +
      "imagePrompt = prompt EN ANGLAIS décrivant l'image clé de la scène en format vertical (sujet, décor, lumière, style photo réaliste), sans texte ; " +
      "motionPrompt = prompt EN ANGLAIS du mouvement de caméra et de l'action (ex. slow dolly in, person smiles and nods) ; " +
      "hooks = 3 variantes de hook alternatives pour tester (A/B).",
    `Écris le script d'une vidéo pub de style « ${VIDEO_STYLES[style]} » pour ${platform}, ` +
      `d'environ ${duration} secondes (≈ ${Math.round(duration * 2.5)} mots au total), en 3 à 7 scènes.\n\n` +
      briefToText(brief) +
      (direction ? "\n\nVARIANTE : utilise un angle, un personnage et un hook complètement différents des autres versions." : ""),
    "medium",
  ));
  return { script: scripts[0], variants: scripts };
}, { cost: ({ variants }) => ({ kind: "video-script", amount: COSTS["video-script"] * variants }) });
