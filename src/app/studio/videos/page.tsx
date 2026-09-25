"use client";

import { useEffect, useMemo, useState } from "react";
import type { VideoScriptResult } from "@/app/api/video/script/route";
import { BriefForm } from "@/components/BriefForm";
import { EmptyState, ErrorBox, GenerateButton, PageHeader, Spinner } from "@/components/ui";
import { api, refreshProfile, useBrief, useGenerate, useStored } from "@/lib/client";
import { COSTS } from "@/lib/plans";
import { VIDEO_STYLES, type VideoStyle } from "@/lib/constants";

type Avatar = { avatar_id: string; avatar_name: string; preview_image_url: string; gender: string };
type Voice = { voice_id: string; name: string; language: string; gender: string; preview_audio: string };
type Render = { projectId: string; status: string; url?: string; error?: string };

export default function VideosPage() {
  const [brief] = useBrief();
  const [script, setScript] = useStored<VideoScriptResult | null>("last-video-script", null);
  const [style, setStyle] = useState<VideoStyle>("ugc");
  const [duration, setDuration] = useState(30);
  const [platform, setPlatform] = useState("TikTok / Instagram Reels");
  const { run, loading, error } = useGenerate<VideoScriptResult>();

  const generate = async () => {
    const res = await run("/api/video/script", { brief, style, duration, platform });
    if (res) setScript(res);
  };

  return (
    <div>
      <PageHeader icon="🎬" title="Vidéos pub IA" desc="Script UGC ou storytelling écrit par l'IA, puis vidéo avec un avatar qui parle face caméra." />
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
                  {[15, 30, 45, 60, 90].map((d) => (
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
            <GenerateButton loading={loading} onClick={generate}>
              ✨ {script ? "Nouveau script" : "Écrire le script"} · {COSTS["video-script"]} crédit
            </GenerateButton>
            <ErrorBox error={error} />
          </div>
          {script && <RenderPanel script={script} horizontal={platform.includes("horizontal")} />}
        </div>
        <div>{script ? <ScriptEditor script={script} onChange={setScript} /> : <EmptyState text="Ton script vidéo (hooks, scènes, voix off, texte à l'écran) apparaîtra ici." />}</div>
      </div>
    </div>
  );
}

function ScriptEditor({ script, onChange }: { script: VideoScriptResult; onChange: (s: VideoScriptResult) => void }) {
  const words = script.scenes.reduce((n, s) => n + s.voiceover.split(/\s+/).filter(Boolean).length, 0);
  const setScene = (i: number, patch: Partial<VideoScriptResult["scenes"][number]>) => {
    const scenes = script.scenes.map((s, j) => (j === i ? { ...s, ...patch } : s));
    onChange({ ...script, scenes });
  };
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
                <button className="text-xs text-brand-600" onClick={() => setScene(0, { voiceover: h + " " + script.scenes[0].voiceover })}>
                  Utiliser
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {script.scenes.map((scene, i) => (
        <div key={i} className="card grid gap-3 md:grid-cols-[1fr_220px]">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="rounded bg-gray-900 px-2 py-0.5 text-xs font-bold text-white">Scène {i + 1}</span>
              <span className="text-sm font-semibold text-gray-600">{scene.label}</span>
            </div>
            <label className="label mt-2">🎙️ Voix off (prononcée par l&apos;avatar)</label>
            <textarea className="input" rows={3} value={scene.voiceover} onChange={(e) => setScene(i, { voiceover: e.target.value })} />
          </div>
          <div className="space-y-2 text-sm">
            <div>
              <div className="label">Texte à l&apos;écran</div>
              <input className="input" value={scene.onScreenText} onChange={(e) => setScene(i, { onScreenText: e.target.value })} />
            </div>
            <div>
              <div className="label">Plan / B-roll</div>
              <p className="text-xs text-gray-600">{scene.visual}</p>
            </div>
            <label className="flex items-center gap-2 text-xs text-gray-500">
              <input type="color" value={/^#[0-9a-f]{6}$/i.test(scene.background) ? scene.background : "#111827"} onChange={(e) => setScene(i, { background: e.target.value })} />
              Fond de la scène
            </label>
          </div>
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

function RenderPanel({ script, horizontal }: { script: VideoScriptResult; horizontal: boolean }) {
  const [assets, setAssets] = useState<{ avatars: Avatar[]; voices: Voice[] } | null>(null);
  const [assetsError, setAssetsError] = useState<string | null>(null);
  const [avatarId, setAvatarId] = useState("");
  const [voiceId, setVoiceId] = useState("");
  const [lang, setLang] = useState("French");
  const [format, setFormat] = useState<"vertical" | "square" | "horizontal">(horizontal ? "horizontal" : "vertical");
  const [captions, setCaptions] = useState(true);
  const [render, setRender] = useStored<Render | null>("last-video-render", null);
  const [submitting, setSubmitting] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  const loadAssets = async () => {
    setAssetsError(null);
    try {
      const data = await api<{ avatars: Avatar[]; voices: Voice[] }>("/api/video/assets");
      setAssets(data);
      setAvatarId(data.avatars[0]?.avatar_id || "");
    } catch (e) {
      setAssetsError(e instanceof Error ? e.message : String(e));
    }
  };

  const voices = useMemo(() => (assets?.voices || []).filter((v) => !lang || v.language?.includes(lang)), [assets, lang]);
  useEffect(() => {
    if (voices.length && !voices.some((v) => v.voice_id === voiceId)) setVoiceId(voices[0].voice_id);
  }, [voices, voiceId]);

  // Suivi du rendu : HeyGen met 1 à 10 minutes à produire la vidéo.
  useEffect(() => {
    if (!render || render.status === "completed" || render.status === "failed") return;
    const timer = setInterval(async () => {
      try {
        const s = await api<{ status: string; url?: string; error?: string }>("/api/video/status", { projectId: render.projectId });
        setRender({ ...render, status: s.status, url: s.url, error: s.error });
        if (s.status === "failed") refreshProfile(); // crédits remboursés
      } catch {
        /* nouvel essai au prochain intervalle */
      }
    }, 10000);
    return () => clearInterval(timer);
  }, [render, setRender]);

  const submit = async () => {
    setSubmitting(true);
    setRenderError(null);
    try {
      const { projectId } = await api<{ projectId: string }>("/api/video/render", {
        title: script.title,
        script,
        avatarId,
        voiceId,
        format,
        captions,
        scenes: script.scenes.map((s) => ({ voiceover: s.voiceover, background: s.background })),
      });
      setRender({ projectId, status: "pending" });
      refreshProfile();
    } catch (e) {
      setRenderError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  const selectedAvatar = assets?.avatars.find((a) => a.avatar_id === avatarId);

  return (
    <div className="card space-y-3">
      <div className="font-bold">2. La vidéo avec avatar IA</div>
      {!assets ? (
        <>
          <button className="btn-ghost w-full" onClick={loadAssets}>
            Charger les avatars et voix (HeyGen)
          </button>
          <ErrorBox error={assetsError} />
        </>
      ) : (
        <>
          <div>
            <label className="label">Avatar</label>
            <div className="flex items-center gap-2">
              {selectedAvatar && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={selectedAvatar.preview_image_url} alt="" className="h-12 w-12 rounded-lg object-cover" />
              )}
              <select className="input" value={avatarId} onChange={(e) => setAvatarId(e.target.value)}>
                {assets.avatars.map((a) => (
                  <option key={a.avatar_id} value={a.avatar_id}>
                    {a.avatar_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-[110px_1fr] gap-2">
            <div>
              <label className="label">Langue</label>
              <select className="input" value={lang} onChange={(e) => setLang(e.target.value)}>
                <option value="French">Français</option>
                <option value="English">Anglais</option>
                <option value="">Toutes</option>
              </select>
            </div>
            <div>
              <label className="label">Voix</label>
              <select className="input" value={voiceId} onChange={(e) => setVoiceId(e.target.value)}>
                {voices.map((v) => (
                  <option key={v.voice_id} value={v.voice_id}>
                    {v.name} ({v.gender})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select className="input" value={format} onChange={(e) => setFormat(e.target.value as typeof format)}>
              <option value="vertical">Vertical 9:16</option>
              <option value="square">Carré 1:1</option>
              <option value="horizontal">Horizontal 16:9</option>
            </select>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={captions} onChange={(e) => setCaptions(e.target.checked)} /> Sous-titres
            </label>
          </div>
          <GenerateButton loading={submitting} onClick={submit} disabled={!avatarId || !voiceId} loadingLabel="Envoi…">
            🎬 Générer la vidéo · {COSTS["video-render"]} crédits
          </GenerateButton>
          <ErrorBox error={renderError} />
        </>
      )}
      {render && (
        <div className="rounded-lg bg-gray-50 p-3 text-sm">
          {render.status === "completed" && render.url ? (
            <>
              <video src={render.url} controls className="w-full rounded-lg" />
              <a className="btn-primary mt-2 w-full" href={render.url} target="_blank" rel="noreferrer">
                Télécharger la vidéo
              </a>
            </>
          ) : render.status === "failed" ? (
            <p className="text-red-600">Échec du rendu : {render.error || "erreur inconnue"}</p>
          ) : (
            <p className="flex items-center gap-2 text-gray-600">
              <span className="text-brand-600">
                <Spinner />
              </span>
              Rendu en cours ({render.status})… 1 à 10 min. La vidéo sera aussi sauvegardée dans « Mes projets ».
            </p>
          )}
        </div>
      )}
    </div>
  );
}
