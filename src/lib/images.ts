import "server-only";
import { AIError } from "./ai";
import { hfImage, type AspectRatio } from "./higgsfield";
import { MAX_AUTO_IMAGES } from "./plans";
import { createAdmin } from "./supabase/server";

// Images IA générées avec Higgsfield (voir higgsfield.ts), puis copiées dans le bucket public « media ».

export const IMAGE_SIZES = ["square_hd", "portrait_4_3", "portrait_16_9", "landscape_4_3", "landscape_16_9"] as const;
export type ImageSize = (typeof IMAGE_SIZES)[number];

const RATIOS: Record<ImageSize, AspectRatio> = {
  square_hd: "1:1",
  portrait_4_3: "3:4",
  portrait_16_9: "9:16",
  landscape_4_3: "4:3",
  landscape_16_9: "16:9",
};

/** Génère une image et la copie dans le bucket public « media » (les liens de génération sont temporaires). */
export async function generateImage(userId: string, prompt: string, size: ImageSize = "landscape_4_3"): Promise<string> {
  const url = await hfImage(prompt, RATIOS[size]);
  const image = await fetch(url);
  if (!image.ok) throw new AIError("Image générée introuvable.", 502);
  const contentType = image.headers.get("content-type") || "image/jpeg";
  const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
  const path = `${userId}/ia-${crypto.randomUUID()}.${ext}`;

  const admin = createAdmin();
  const { error } = await admin.storage.from("media").upload(path, await image.arrayBuffer(), { contentType });
  if (error) throw new AIError("Impossible d'enregistrer l'image.", 502);
  return admin.storage.from("media").getPublicUrl(path).data.publicUrl;
}

/** Consigne donnée à Claude pour qu'il place des images IA dans le HTML. */
export const AI_IMAGE_INSTRUCTIONS =
  `Pour les images importantes (hero, produit, ambiance), utilise au maximum ${MAX_AUTO_IMAGES} balises ` +
  `<img src="ai:DESCRIPTION"> où DESCRIPTION est un prompt photo détaillé EN ANGLAIS (sujet, cadrage, lumière, style), ` +
  `sans texte dans l'image. N'utilise aucune autre image externe.`;

const AI_SRC = /src="ai:([^"]{3,600})"/g;

/**
 * Remplace les `src="ai:…"` d'un HTML par de vraies images générées.
 * Renvoie le HTML et le nombre d'images non générées (pour rembourser les crédits correspondants).
 */
export async function fillAiImages(userId: string, html: string): Promise<{ html: string; failed: number }> {
  const prompts = Array.from(new Set(Array.from(html.matchAll(AI_SRC), (m) => m[1]))).slice(0, MAX_AUTO_IMAGES);
  const results = await Promise.allSettled(prompts.map((p) => generateImage(userId, p, "landscape_4_3")));
  const urls = new Map<string, string>();
  results.forEach((r, i) => r.status === "fulfilled" && urls.set(prompts[i], r.value));

  const fallback = urls.values().next().value;
  const out = html.replace(AI_SRC, (_, prompt: string) => {
    const url = urls.get(prompt) || fallback;
    return url ? `src="${url}"` : 'src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" style="display:none"';
  });
  return { html: out, failed: MAX_AUTO_IMAGES - urls.size };
}

/** Enregistre une image ou un audio WAV envoyé en data URL dans le bucket public « media ». */
export async function uploadDataUrl(userId: string, dataUrl: string): Promise<string> {
  const match = dataUrl.match(/^data:((?:image|audio)\/(png|jpeg|webp|wav));base64,(.+)$/);
  if (!match) throw new AIError("Fichier invalide.", 400);
  const ext = match[2] === "jpeg" ? "jpg" : match[2];
  const path = `${userId}/import-${crypto.randomUUID()}.${ext}`;
  const admin = createAdmin();
  const { error } = await admin.storage.from("media").upload(path, Buffer.from(match[3], "base64"), { contentType: match[1] });
  if (error) throw new AIError("Impossible d'enregistrer l'image.", 502);
  return admin.storage.from("media").getPublicUrl(path).data.publicUrl;
}
