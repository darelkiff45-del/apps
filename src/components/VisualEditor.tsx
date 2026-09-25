"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { api, refreshProfile } from "@/lib/client";
import { COSTS } from "@/lib/plans";
import { extractPalette, injectEditor, toSixDigits } from "./editor-script";

type Msg = { __cd: true; type: string; [k: string]: unknown };

/** Éditeur visuel : textes (clic direct), images, couleurs et sections d'une page HTML générée. */
export function VisualEditor({ html, onSave, onCancel }: { html: string; onSave: (html: string) => Promise<void>; onCancel: () => void }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const srcDoc = useMemo(() => injectEditor(html), [html]);
  const [palette, setPalette] = useState(() => extractPalette(html).map((c) => ({ original: c, current: c })));
  const [image, setImage] = useState<{ src: string; alt: string } | null>(null);
  const [blockTag, setBlockTag] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pendingSave = useRef<((html: string) => void) | null>(null);

  const send = (m: Record<string, unknown>) => frame.current?.contentWindow?.postMessage({ __cd: true, ...m }, "*");

  useEffect(() => {
    const onMessage = (e: MessageEvent<Msg>) => {
      if (e.source !== frame.current?.contentWindow || !e.data?.__cd) return;
      const m = e.data;
      if (m.type === "image") {
        setImage(m.src === null ? null : { src: String(m.src), alt: String(m.alt || "") });
        setImageUrl(m.src ? String(m.src) : "");
      }
      if (m.type === "block") setBlockTag((m.tag as string) || null);
      if (m.type === "html") pendingSave.current?.(String(m.html));
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const setImageSrc = (src: string) => {
    send({ type: "set-image", src });
    setImage((i) => (i ? { ...i, src } : i));
    setImageUrl(src);
  };

  const upload = async (file: File) => {
    setBusy("upload");
    setError(null);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.onerror = reject;
        r.readAsDataURL(file);
      });
      const { url } = await api<{ url: string }>("/api/media", { dataUrl });
      setImageSrc(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  const generate = async () => {
    if (prompt.trim().length < 3) return;
    setBusy("ai");
    setError(null);
    try {
      const { url } = await api<{ url: string }>("/api/image", { prompt, size: "landscape_4_3" });
      setImageSrc(url);
      refreshProfile();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  const save = async () => {
    setBusy("save");
    setError(null);
    const edited = await new Promise<string>((resolve) => {
      pendingSave.current = resolve;
      send({ type: "get-html" });
    });
    pendingSave.current = null;
    try {
      await onSave(edited);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="card p-0">
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 p-3">
        <span className="text-sm font-bold">✏️ Éditeur visuel</span>
        <span className="text-xs text-gray-500">Clique sur un texte pour l&apos;écrire, sur une image pour la changer. Ctrl+Z pour annuler.</span>
        <div className="ml-auto flex gap-2">
          <button className="btn-ghost py-1 text-xs" onClick={onCancel} disabled={!!busy}>
            Annuler
          </button>
          <button className="btn-primary py-1 text-xs" onClick={save} disabled={!!busy}>
            {busy === "save" ? "Enregistrement…" : "💾 Enregistrer"}
          </button>
        </div>
      </div>
      <div className="grid lg:grid-cols-[1fr_260px]">
        <div className="bg-gray-100 p-3">
          <iframe ref={frame} title="Éditeur" srcDoc={srcDoc} sandbox="allow-scripts" className="h-[75vh] w-full rounded-lg bg-white shadow" />
        </div>
        <div className="space-y-5 border-t border-gray-100 p-4 text-sm lg:border-t-0 lg:border-l">
          <div>
            <div className="label">Section sélectionnée</div>
            {blockTag ? (
              <div className="grid grid-cols-2 gap-2">
                <button className="btn-ghost py-1 text-xs" onClick={() => send({ type: "block", action: "up" })}>
                  ↑ Monter
                </button>
                <button className="btn-ghost py-1 text-xs" onClick={() => send({ type: "block", action: "down" })}>
                  ↓ Descendre
                </button>
                <button className="btn-ghost py-1 text-xs" onClick={() => send({ type: "block", action: "duplicate" })}>
                  ⧉ Dupliquer
                </button>
                <button className="btn-ghost py-1 text-xs text-red-600" onClick={() => send({ type: "block", action: "delete" })}>
                  🗑 Supprimer
                </button>
              </div>
            ) : (
              <p className="text-xs text-gray-400">Clique dans une section de la page.</p>
            )}
          </div>

          <div>
            <div className="label">Image sélectionnée</div>
            {image ? (
              <div className="space-y-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.src} alt="" className="h-24 w-full rounded-lg bg-gray-100 object-cover" />
                <div className="flex gap-1">
                  <input className="input py-1 text-xs" placeholder="https://…" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
                  <button className="btn-ghost px-2 py-1 text-xs" onClick={() => setImageSrc(imageUrl)}>
                    OK
                  </button>
                </div>
                <label className="btn-ghost w-full cursor-pointer py-1 text-xs">
                  {busy === "upload" ? "Envoi…" : "📁 Importer une image"}
                  <input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
                </label>
                <textarea
                  className="input text-xs"
                  rows={2}
                  placeholder="Décris l'image à générer (ex. femme africaine souriante travaillant sur son ordinateur, lumière naturelle)"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
                <button className="btn-primary w-full py-1 text-xs" onClick={generate} disabled={!!busy}>
                  {busy === "ai" ? "Génération…" : `✨ Image IA · ${COSTS.image} crédit`}
                </button>
              </div>
            ) : (
              <p className="text-xs text-gray-400">Clique sur une image de la page.</p>
            )}
          </div>

          {palette.length > 0 && (
            <div>
              <div className="label">Couleurs de la page</div>
              <div className="grid grid-cols-5 gap-2">
                {palette.map((c, i) => (
                  <input
                    key={c.original}
                    type="color"
                    title={c.current}
                    className="h-9 w-full cursor-pointer rounded"
                    value={toSixDigits(c.current)}
                    onChange={(e) => {
                      send({ type: "color", from: c.current, to: e.target.value });
                      setPalette(palette.map((p, j) => (j === i ? { ...p, current: e.target.value } : p)));
                    }}
                  />
                ))}
              </div>
            </div>
          )}
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
        </div>
      </div>
    </div>
  );
}
