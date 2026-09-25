"use client";

import { useEffect, useRef, useState } from "react";
import type { VideoScriptResult } from "@/app/api/video/script/route";
import { BriefForm } from "@/components/BriefForm";
import { VariantToggle } from "@/components/Options";
import { EmptyState, ErrorBox, GenerateButton, PageHeader, Spinner } from "@/components/ui";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { api, refreshProfile, useBrief, useGenerate, useStored } from "@/lib/client";
import { VIDEO_STYLES, type VideoStyle } from "@/lib/constants";
import { COSTS } from "@/lib/plans";

type BaseScene = VideoScriptResult["scenes"][number];
/** Scène du script + réglages de production. */
type Scene = BaseScene & { mode?: "animate" | "speak"; useProduct?: boolean; audioUrl?: string; audioSeconds?: number };
type Script = Omit<VideoScriptResult, "scenes"> & { scenes: Scene[] };
type ScriptResponse = { script: VideoScriptResult; variants: VideoScriptResult[] };

type Clip = { label: string; mode: string; status: string; onScreenText: string; voiceover: string; imageUrl?: string; url?: string; error?: string };
type Production = { projectId: string; done: boolean; scenes: Clip[] };

const LETTERS = ["A", "B", "C"];

export default function VideosPage() {
  const [brief] = useBrief();
  const [script, setScript] = useStored<Script | null>("last-video-script-v2", null);
  const [variants, setVariants] = useStored<VideoScriptResult[]>("last-video-variants", []);
  const [style, setStyle] = useState<VideoStyle>("ugc");
  const [duration, setDuration] = useState(30);
  const [platform, setPlatform] = useState("TikTok / Instagram Reels");
  const [count, setCount] = useState<1 | 3>(1);
  const { run, loading, error } = useGenerate<ScriptResponse>();

  const generate = async () => {
    const res = await run("/api/video/script", { brief, style, duration, platform, variants: count });
    if (res) {
      setVariants(res.variants);
      setScript(prepare(res.script, style));
    }
  };

  return (
    <div>
      <PageHeader icon="🎬" title="Vidéos pub IA" desc="Script UGC ou storytelling écrit par l'IA, puis chaque scène produite avec Higgsfield : plans animés et avatar qui parle avec ta voix." />
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="space-y-4">
          <BriefForm compact />
          <div className="card space-y-3">
            <div className="font-bold">1. Le script</div>
            <div>
              <label className="label">Style de vidéo</label>
              <select className="input" value={style} onChange={(e) => setStyle(e.target.value as VideoStyle)}>
                {Object.entries(VIDEO_STYLES).map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Durée (s)</label>
                <select className="input" value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
                  {[15, 30, 45, 60].map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Plateforme</label>
                <select className="input" value={platform} onChange={(e) => setPlatform(e.target.value)}>
                  <option>TikTok / Instagram Reels</option>
                  <option>Facebook Ads</option>
                  <option>YouTube Shorts</option>
                  <option>YouTube (horizontal)</option>
                </select>
              </div>
            </div>
            <VariantToggle value={count} onChange={setCount} />
            <GenerateButton loading={loading} onClick={generate}>
              ✨ {script ? "Nouveau script" : "Écrire le script"} · {COSTS["video-script"] * count} crédit{count > 1 ? "s" : ""}
            </GenerateButton>
            <ErrorBox error={error} />
          </div>
          {script && <ProductionPanel script={script} horizontal={platform.includes("horizontal")} />}
        </div>
        <div className="space-y-4">
          {variants.length > 1 && script && (
            <div className="card flex flex-wrap items-center gap-2 py-3">
              <span className="mr-2 text-sm font-bold">Choisis ton script :</span>
              {variants.map((v, i) => (
                <button
                  key={i}
                  onClick={() => setScript(prepare(v, style))}
                  className={`rounded-lg px-4 py-1.5 text-sm font-bold ${v.title === script.title ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600"}`}
                >
                  Script {LETTERS[i]}
                </button>
              ))}
            </div>
          )}
          {script ? (
            <ScriptEditor script={script} onChange={setScript} />
          ) : (
            <EmptyState text="Ton script vidéo (hooks, scènes, voix off, texte à l'écran) apparaîtra ici." />
          )}
        </div>
      </div>
    </div>
  );
}

/** En UGC, la 1re scène est parlée face caméra par défaut ; les autres sont des plans animés. */
function prepare(s: VideoScriptResult, style: VideoStyle): Script {
  return { ...s, scenes: s.scenes.map((sc, i) => ({ ...sc, mode: style === "ugc" && i === 0 ? "speak" : "animate" })) };
}

function ScriptEditor({ script, onChange }: { script: Script; onChange: (s: Script) => void }) {
  const [hasProduct, setHasProduct] = useState(false);
  useEffect(() => {
    try {
      setHasProduct(Boolean(localStorage.getItem("cover-image") && localStorage.getItem("cover-image") !== "null"));
    } catch {
      /* rien */
    }
  }, []);
  const words = script.scenes.reduce((n, s) => n + s.voiceover.split(/\s+/).filter(Boolean).length, 0);
  const setScene = (i: number, patch: Partial<Scene>) => onChange({ ...script, scenes: script.scenes.map((s, j) => (j === i ? { ...s, ...patch } : s)) });

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold">{script.title}</h2>
          <span className="text-xs text-gray-500">
            {words} mots · ≈ {Math.round(words / 2.5)} s
          </span>
        </div>
        <div className="mt-3">
          <div className="label">Hooks alternatifs à tester (A/B)</div>
          <ul className="space-y-1 text-sm">
            {script.hooks.map((h, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-brand-600">⚡</span>
                <span className="flex-1">{h}</span>
                <button className="text-xs text-brand-600" onClick={() => setScene(0, { voiceover: h })}>
                  Utiliser
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {script.scenes.map((scene, i) => (
        <div key={i} className="card space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded bg-gray-900 px-2 py-0.5 text-xs font-bold text-white">Scène {i + 1}</span>
            <span className="text-sm font-semibold text-gray-600">{scene.label}</span>
            <div className="ml-auto grid grid-cols-2 rounded-lg bg-gray-100 p-1 text-xs font-semibold">
              {(["animate", "speak"] as const).map((m) => (
                <button key={m} onClick={() => setScene(i, { mode: m })} className={`rounded-md px-3 py-1 ${scene.mode === m ? "bg-white shadow" : "text-gray-500"}`}>
                  {m === "animate" ? "🎞 Plan animé" : "🗣 Avatar qui parle"}
                </button>
              ))}
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="label">🎙️ Voix off / texte dit</label>
              <textarea className="input" rows={3} value={scene.voiceover} onChange={(e) => setScene(i, { voiceover: e.target.value })} />
            </div>
            <div>
              <label className="label">Texte à l&apos;écran</label>
              <input className="input" value={scene.onScreenText} onChange={(e) => setScene(i, { onScreenText: e.target.value })} />
              <p className="mt-2 text-xs text-gray-500">🎬 {scene.visual}</p>
            </div>
          </div>
          {scene.mode === "speak" ? (
            <div className="rounded-lg bg-brand-50 p-3">
              <div className="label">Voix de l&apos;avatar (lis le texte ci-dessus, 15 s max)</div>
              <VoiceRecorder audioUrl={scene.audioUrl} seconds={scene.audioSeconds} onChange={(v) => setScene(i, v)} />
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="label">Image de la scène (description en anglais)</label>
                <textarea
                  className="input text-xs"
                  rows={2}
                  disabled={scene.useProduct}
                  value={scene.imagePrompt}
                  onChange={(e) => setScene(i, { imagePrompt: e.target.value })}
                />
                {hasProduct && (
                  <label className="mt-1 flex items-center gap-2 text-xs text-gray-600">
                    <input type="checkbox" checked={!!scene.useProduct} onChange={(e) => setScene(i, { useProduct: e.target.checked })} />
                    Utiliser le mockup de mon produit
                  </label>
                )}
              </div>
              <div>
                <label className="label">Mouvement de caméra (anglais)</label>
                <textarea className="input text-xs" rows={2} value={scene.motionPrompt} onChange={(e) => setScene(i, { motionPrompt: e.target.value })} />
              </div>
            </div>
          )}
        </div>
      ))}
      <div className="card">
        <div className="label">Légende de la publication</div>
        <p className="text-sm whitespace-pre-line">{script.caption}</p>
        <p className="mt-2 text-sm text-brand-600">{script.hashtags.map((h) => (h.startsWith("#") ? h : "#" + h)).join(" ")}</p>
      </div>
    </div>
  );
}

function ProductionPanel({ script, horizontal }: { script: Script; horizontal: boolean }) {
  const [format, setFormat] = useState<"vertical" | "square" | "horizontal">(horizontal ? "horizontal" : "vertical");
  const [avatar, setAvatar] = useStored<string | null>("video-avatar", null);
  const [avatarPrompt, setAvatarPrompt] = useState("Portrait photo of a smiling young African woman, natural light, looking at camera, casual outfit, vertical selfie video style");
  const [production, setProduction] = useStored<Production | null>("last-video-production", null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const needsAvatar = script.scenes.some((s) => s.mode === "speak");
  const missingVoice = script.scenes.some((s) => s.mode === "speak" && !s.audioUrl);
  const cost = script.scenes.length * COSTS["video-render"];

  // Suivi de la production (Higgsfield met 1 à 5 min par scène).
  useEffect(() => {
    if (!production || production.done) return;
    const timer = setInterval(async () => {
      try {
        const s = await api<{ done: boolean; scenes: Clip[] }>("/api/video/status", { projectId: production.projectId });
        setProduction({ ...production, ...s });
        if (s.done) refreshProfile();
      } catch {
        /* nouvel essai au prochain passage */
      }
    }, 10000);
    return () => clearInterval(timer);
  }, [production, setProduction]);

  const makeAvatar = async () => {
    setBusy("avatar");
    setError(null);
    try {
      const { url } = await api<{ url: string }>("/api/image", { prompt: avatarPrompt, size: "portrait_16_9" });
      setAvatar(url);
      refreshProfile();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  const uploadAvatar = async (file: File) => {
    setBusy("avatar");
    setError(null);
    try {
      const dataUrl = await new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(String(r.result));
        r.onerror = rej;
        r.readAsDataURL(file);
      });
      const { url } = await api<{ url: string }>("/api/media", { dataUrl });
      setAvatar(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  const produce = async () => {
    setBusy("render");
    setError(null);
    try {
      let productImage: string | undefined;
      try {
        const stored = localStorage.getItem("cover-image");
        productImage = stored && stored !== "null" ? JSON.parse(stored) : undefined;
      } catch {
        /* rien */
      }
      const res = await api<{ projectId: string; scenes: Clip[] }>("/api/video/render", {
        title: script.title,
        script,
        format,
        productImage: script.scenes.some((s) => s.useProduct) ? productImage : undefined,
        avatarImage: needsAvatar ? avatar || undefined : undefined,
        scenes: script.scenes.map((s) => ({
          mode: s.mode || "animate",
          label: s.label,
          voiceover: s.voiceover,
          onScreenText: s.onScreenText,
          imagePrompt: s.imagePrompt,
          motionPrompt: s.motionPrompt,
          useProduct: !!s.useProduct,
          audioUrl: s.audioUrl,
          audioSeconds: s.audioSeconds,
        })),
      });
      setProduction({ projectId: res.projectId, done: false, scenes: res.scenes });
      refreshProfile();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="card space-y-3">
      <div className="font-bold">2. Produire la vidéo (Higgsfield)</div>
      <div>
        <label className="label">Format</label>
        <select className="input" value={format} onChange={(e) => setFormat(e.target.value as typeof format)}>
          <option value="vertical">Vertical 9:16 (TikTok, Reels)</option>
          <option value="square">Carré 1:1</option>
          <option value="horizontal">Horizontal 16:9</option>
        </select>
      </div>
      {needsAvatar && (
        <div className="space-y-2 rounded-lg bg-gray-50 p-3">
          <div className="label">Visage de l&apos;avatar</div>
          {avatar && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt="Avatar" className="h-40 w-full rounded-lg object-cover" />
          )}
          <textarea className="input text-xs" rows={2} value={avatarPrompt} onChange={(e) => setAvatarPrompt(e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <button className="btn-ghost py-1 text-xs" disabled={!!busy} onClick={makeAvatar}>
              {busy === "avatar" ? "…" : `✨ Générer · ${COSTS.image} crédit`}
            </button>
            <label className="btn-ghost cursor-pointer py-1 text-xs">
              📁 Ma photo
              <input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
            </label>
          </div>
        </div>
      )}
      {missingVoice && <p className="text-xs text-amber-700">Enregistre la voix des scènes « Avatar qui parle » avant de lancer.</p>}
      <GenerateButton loading={busy === "render"} onClick={produce} disabled={missingVoice || (needsAvatar && !avatar)} loadingLabel="Lancement des scènes…">
        🎬 Produire {script.scenes.length} scènes · {cost} crédits
      </GenerateButton>
      <p className="text-xs text-gray-500">Formules Pro et Business. Les scènes qui échouent sont remboursées.</p>
      <ErrorBox error={error} />
      {production && <Player production={production} />}
    </div>
  );
}

/** Lecture enchaînée des clips avec le texte à l'écran en surimpression. */
function Player({ production }: { production: Production }) {
  const ready = production.scenes.filter((s) => s.url);
  const [index, setIndex] = useState(0);
  const video = useRef<HTMLVideoElement>(null);
  const current = ready[index % Math.max(ready.length, 1)];

  return (
    <div className="space-y-3 rounded-lg bg-gray-50 p-3 text-sm">
      {current?.url ? (
        <div className="relative overflow-hidden rounded-lg bg-black">
          <video
            ref={video}
            key={current.url}
            src={current.url}
            autoPlay
            controls
            playsInline
            className="w-full"
            onEnded={() => setIndex((i) => (i + 1) % ready.length)}
          />
          {current.onScreenText && (
            <div className="pointer-events-none absolute inset-x-3 top-6 text-center text-lg font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,.9)]">
              {current.onScreenText}
            </div>
          )}
        </div>
      ) : null}
      <ul className="space-y-1">
        {production.scenes.map((s, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="w-16 shrink-0 text-xs font-bold">Scène {i + 1}</span>
            <span className="min-w-0 flex-1 truncate text-xs text-gray-600">{s.label}</span>
            {s.url ? (
              <a href={s.url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-brand-700 underline">
                ⬇ Clip
              </a>
            ) : s.status === "failed" || s.status === "nsfw" ? (
              <span className="text-xs text-red-600">{s.error || "Échec"} (remboursé)</span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <span className="text-brand-600">
                  <Spinner />
                </span>
                en cours
              </span>
            )}
          </li>
        ))}
      </ul>
      {!production.done && <p className="text-xs text-gray-500">Production en cours (1 à 5 min par scène). Tu peux quitter la page : tout est sauvegardé dans « Mes projets ».</p>}
      {production.done && <p className="text-xs text-gray-500">Astuce : assemble les clips et ta voix off dans CapCut pour la version finale.</p>}
    </div>
  );
}
