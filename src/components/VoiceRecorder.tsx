"use client";

import { useRef, useState } from "react";
import { api } from "@/lib/client";
import { toWav } from "@/lib/wav";

const MAX_SECONDS = 15;

/** Enregistre (ou importe) la voix d'une scène, la convertit en WAV et l'envoie dans le cloud. */
export function VoiceRecorder({
  audioUrl,
  seconds,
  onChange,
}: {
  audioUrl?: string;
  seconds?: number;
  onChange: (v: { audioUrl?: string; audioSeconds?: number }) => void;
}) {
  const [state, setState] = useState<"idle" | "recording" | "uploading">("idle");
  const [error, setError] = useState<string | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const send = async (blob: Blob) => {
    setState("uploading");
    setError(null);
    try {
      const wav = await toWav(blob);
      if (wav.seconds > MAX_SECONDS + 0.5) throw new Error(`Maximum ${MAX_SECONDS} secondes par scène parlée.`);
      const { url } = await api<{ url: string }>("/api/media", { dataUrl: wav.dataUrl });
      onChange({ audioUrl: url, audioSeconds: Math.round(wav.seconds * 10) / 10 });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setState("idle");
    }
  };

  const start = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => chunks.push(e.data);
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        if (timer.current) clearTimeout(timer.current);
        send(new Blob(chunks, { type: rec.mimeType }));
      };
      rec.start();
      recorder.current = rec;
      setState("recording");
      timer.current = setTimeout(() => rec.state === "recording" && rec.stop(), MAX_SECONDS * 1000);
    } catch {
      setError("Micro inaccessible : autorise l'accès au micro dans ton navigateur.");
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {state === "recording" ? (
          <button className="btn bg-red-600 py-1 text-xs text-white" onClick={() => recorder.current?.stop()}>
            ⏹ Arrêter (max {MAX_SECONDS} s)
          </button>
        ) : (
          <button className="btn-ghost py-1 text-xs" disabled={state === "uploading"} onClick={start}>
            {state === "uploading" ? "Envoi…" : audioUrl ? "🎙 Réenregistrer" : "🎙 Enregistrer ma voix"}
          </button>
        )}
        <label className="btn-ghost cursor-pointer py-1 text-xs">
          📁 Importer un audio
          <input type="file" accept="audio/*" hidden onChange={(e) => e.target.files?.[0] && send(e.target.files[0])} />
        </label>
      </div>
      {audioUrl && (
        <div className="flex items-center gap-2">
          <audio src={audioUrl} controls className="h-8 flex-1" />
          <span className="text-xs text-gray-500">{seconds} s</span>
        </div>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
