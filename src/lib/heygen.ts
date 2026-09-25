import "server-only";
import { AIError } from "./ai";

// Intégration HeyGen (avatars IA qui parlent face caméra) : https://docs.heygen.com
const BASE = "https://api.heygen.com";

function apiKey() {
  const key = process.env.HEYGEN_API_KEY;
  if (!key) {
    throw new AIError(
      "Clé API HeyGen manquante. Ajoute HEYGEN_API_KEY dans .env.local pour générer les vidéos.",
      401,
    );
  }
  return key;
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(BASE + path, {
    ...init,
    headers: {
      "X-Api-Key": apiKey(),
      "Content-Type": "application/json",
      Accept: "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.error) {
    const msg = json?.error?.message || json?.message || res.statusText;
    throw new AIError(`Erreur HeyGen : ${msg}`, res.status === 401 ? 401 : 502);
  }
  return json.data as T;
}

export type Avatar = { avatar_id: string; avatar_name: string; preview_image_url: string; gender: string };
export type Voice = { voice_id: string; name: string; language: string; gender: string; preview_audio: string };

export async function listAvatars() {
  const data = await call<{ avatars: Avatar[] }>("/v2/avatars");
  return data.avatars;
}

export async function listVoices() {
  const data = await call<{ voices: Voice[] }>("/v2/voices");
  return data.voices;
}

export type Scene = { voiceover: string; background: string };

export async function createVideo(opts: {
  avatarId: string;
  voiceId: string;
  scenes: Scene[];
  format: "vertical" | "square" | "horizontal";
  captions: boolean;
}) {
  const dimension =
    opts.format === "vertical"
      ? { width: 720, height: 1280 }
      : opts.format === "square"
        ? { width: 1080, height: 1080 }
        : { width: 1280, height: 720 };

  const data = await call<{ video_id: string }>("/v2/video/generate", {
    method: "POST",
    body: JSON.stringify({
      caption: opts.captions,
      dimension,
      video_inputs: opts.scenes.map((scene) => ({
        character: { type: "avatar", avatar_id: opts.avatarId, avatar_style: "normal" },
        voice: { type: "text", voice_id: opts.voiceId, input_text: scene.voiceover },
        background: { type: "color", value: scene.background },
      })),
    }),
  });
  return data.video_id;
}

export type VideoStatus = {
  status: "pending" | "waiting" | "processing" | "completed" | "failed";
  video_url?: string;
  thumbnail_url?: string;
  error?: { message?: string } | null;
};

export async function videoStatus(videoId: string) {
  return call<VideoStatus>(`/v1/video_status.get?video_id=${encodeURIComponent(videoId)}`);
}
