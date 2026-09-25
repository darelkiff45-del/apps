"use client";

import { useState } from "react";
import { api } from "@/lib/client";
import { HtmlPreview } from "./HtmlPreview";
import { PublishPanel } from "./PublishPanel";
import { VisualEditor } from "./VisualEditor";

export type HtmlResult = { html: string; variants?: string[]; projectId?: string | null };

const LETTERS = ["A", "B", "C"];

/** Résultat HTML : choix de la variante, aperçu, éditeur visuel et publication. */
export function HtmlWorkspace({
  result,
  onChange,
  filename,
  title,
  printable = false,
  publishable = false,
}: {
  result: HtmlResult;
  onChange: (r: HtmlResult) => void;
  filename: string;
  title: string;
  printable?: boolean;
  publishable?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const variants = result.variants || [];

  const persist = async (next: HtmlResult) => {
    onChange(next);
    if (!next.projectId) return;
    const r = await api<{ republished: boolean }>(`/api/projects/${next.projectId}`, { data: { html: next.html, variants: next.variants } }, "PATCH");
    setNotice(r.republished ? "✓ Enregistré et mis à jour en ligne." : "✓ Enregistré.");
    setTimeout(() => setNotice(null), 3000);
  };

  return (
    <div className="space-y-4">
      {variants.length > 1 && !editing && (
        <div className="card flex flex-wrap items-center gap-2 py-3">
          <span className="mr-2 text-sm font-bold">Choisis ta version :</span>
          {variants.map((v, i) => (
            <button
              key={i}
              onClick={() => persist({ ...result, html: v })}
              className={`rounded-lg px-4 py-1.5 text-sm font-bold ${v === result.html ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              Version {LETTERS[i]}
            </button>
          ))}
        </div>
      )}
      {notice && <div className="rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700">{notice}</div>}
      {editing ? (
        <VisualEditor
          html={result.html}
          onCancel={() => setEditing(false)}
          onSave={async (html) => {
            // La version modifiée remplace la variante choisie.
            const idx = variants.indexOf(result.html);
            const nextVariants = idx >= 0 ? variants.map((v, i) => (i === idx ? html : v)) : variants;
            await persist({ ...result, html, variants: nextVariants });
            setEditing(false);
          }}
        />
      ) : (
        <>
          <div className="flex justify-end">
            <button className="btn-ghost" onClick={() => setEditing(true)}>
              ✏️ Modifier textes, images et couleurs
            </button>
          </div>
          <HtmlPreview html={result.html} filename={filename} printable={printable} />
        </>
      )}
      {publishable && result.projectId && !editing && <PublishPanel projectId={result.projectId} suggestion={title} />}
    </div>
  );
}
