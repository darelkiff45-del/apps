"use client";

import { useState } from "react";
import { download } from "@/lib/client";

const SIZES = { desktop: "100%", tablet: "768px", mobile: "390px" } as const;

/** Aperçu d'un document HTML généré, avec export. */
export function HtmlPreview({ html, filename, printable = false }: { html: string; filename: string; printable?: boolean }) {
  const [size, setSize] = useState<keyof typeof SIZES>("desktop");
  const [copied, setCopied] = useState(false);

  const openTab = (print: boolean) => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    if (print) setTimeout(() => w.print(), 800);
  };

  return (
    <div className="card p-0">
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 p-3">
        {!printable &&
          (Object.keys(SIZES) as (keyof typeof SIZES)[]).map((s) => (
            <button
              key={s}
              onClick={() => setSize(s)}
              className={`rounded-md px-3 py-1 text-xs font-semibold ${size === s ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"}`}
            >
              {s === "desktop" ? "🖥️ Ordinateur" : s === "tablet" ? "📱 Tablette" : "📱 Mobile"}
            </button>
          ))}
        <div className="ml-auto flex flex-wrap gap-2">
          <button
            className="btn-ghost py-1 text-xs"
            onClick={async () => {
              await navigator.clipboard.writeText(html);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
          >
            {copied ? "✓ Copié" : "Copier le code"}
          </button>
          <button className="btn-ghost py-1 text-xs" onClick={() => openTab(false)}>
            Ouvrir ↗
          </button>
          {printable && (
            <button className="btn-ghost py-1 text-xs" onClick={() => openTab(true)}>
              Exporter en PDF
            </button>
          )}
          <button className="btn-primary py-1 text-xs" onClick={() => download(filename, html)}>
            Télécharger .html
          </button>
        </div>
      </div>
      <div className="flex justify-center bg-gray-100 p-3">
        <iframe
          title="Aperçu"
          srcDoc={html}
          sandbox="allow-scripts allow-popups"
          className="h-[75vh] rounded-lg bg-white shadow transition-all"
          style={{ width: SIZES[size] }}
        />
      </div>
    </div>
  );
}
