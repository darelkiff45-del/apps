import "server-only";
import { createHiggsfieldClient, type HiggsfieldClient } from "@higgsfield/client/v2";
import { AIError } from "./ai";

// Higgsfield : images (text-to-image) et vidéos (DoP image→vidéo, Speak avatar parlant).
// SDK officiel : https://www.npmjs.com/package/@higgsfield/client
const BASE = "https://api.higgsfield.ai";
export const IMAGE_MODEL = process.env.HIGGSFIELD_IMAGE_MODEL || "flux-pro/kontext/max/text-to-image";
export const DOP_MODEL = (process.env.HIGGSFIELD_DOP_MODEL || "dop-turbo") as "dop-lite" | "dop-turbo" | "dop-standard";

function credentials() {
  const c = process.env.HF_CREDENTIALS;
  if (!c || !c.includes(":")) {
    throw new AIError("Higgsfield non configuré : ajoute HF_CREDENTIALS=KEY_ID:KEY_SECRET dans .env.local.", 503);
  }
  return c;
}

let client: HiggsfieldClient | null = null;
function hf() {
  if (!client) client = createHiggsfieldClient({ credentials: credentials() }, { autoLoadSchemas: false });
  return client;
}

function toAIError(err: unknown): never {
  if (err instanceof AIError) throw err;
  const e = err as { name?: string; message?: string; statusCode?: number };
  if (e?.name === "NotEnoughCreditsError") throw new AIError("Le compte Higgsfield n'a plus de crédits.", 502);
  if (e?.name === "AuthenticationError") throw new AIError("Identifiants Higgsfield invalides (HF_CREDENTIALS).", 502);
  throw new AIError(`Erreur Higgsfield : ${e?.message || "inconnue"}`, 502);
}

export type AspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";

/** Génère une image et attend le résultat (quelques secondes à ~1 min). Renvoie l'URL Higgsfield. */
export async function hfImage(prompt: string, aspect_ratio: AspectRatio): Promise<string> {
  let res;
  try {
    res = await hf().subscribe(IMAGE_MODEL, {
      input: { prompt, aspect_ratio, safety_tolerance: 2 },
      withPolling: true,
    });
  } catch (err) {
    toAIError(err);
  }
  if (res.status === "nsfw") throw new AIError("Image refusée par la modération. Reformule la description.", 422);
  const url = res.images?.[0]?.url;
  if (res.status !== "completed" || !url) throw new AIError("La génération d'image a échoué.", 502);
  return url;
}

/** Lance l'animation d'une image (DoP) sans attendre : renvoie l'identifiant de la requête. */
export async function hfAnimate(imageUrl: string, prompt: string): Promise<string> {
  try {
    const res = await hf().subscribe("/v1/image2video/dop", {
      input: { model: DOP_MODEL, prompt, input_images: [{ type: "image_url", image_url: imageUrl }] },
      withPolling: false,
    });
    return res.request_id;
  } catch (err) {
    toAIError(err);
  }
}

/** Lance un avatar parlant (Speak) : un visage + un audio WAV. Renvoie l'identifiant de la requête. */
export async function hfSpeak(imageUrl: string, audioUrl: string, prompt: string, duration: 5 | 10 | 15): Promise<string> {
  try {
    const res = await hf().subscribe("/v1/speak/higgsfield", {
      input: {
        input_image: { type: "image_url", image_url: imageUrl },
        input_audio: { type: "audio_url", audio_url: audioUrl },
        prompt,
        quality: "high",
        duration,
      },
      withPolling: false,
    });
    return res.request_id;
  } catch (err) {
    toAIError(err);
  }
}

export type HfStatus = { status: "queued" | "in_progress" | "completed" | "failed" | "nsfw"; videoUrl?: string };

/** État d'une requête (GET /requests/{id}/status). */
export async function hfStatus(requestId: string): Promise<HfStatus> {
  const res = await fetch(`${BASE}/requests/${encodeURIComponent(requestId)}/status`, {
    headers: { Authorization: `Key ${credentials()}`, Accept: "application/json" },
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new AIError(`Erreur Higgsfield : ${json?.detail || json?.message || res.statusText}`, 502);
  return { status: json.status, videoUrl: json.video?.url };
}
