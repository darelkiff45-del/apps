"use client";

import { useEffect, useState } from "react";
import { api, slugify } from "@/lib/client";

type Site = { id: string; project_id: string; slug: string; url: string; views: number };

/** Publier une page en 1 clic sur son adresse (sous-domaine). */
export function PublishPanel({ projectId, suggestion }: { projectId: string; suggestion: string }) {
  const [site, setSite] = useState<Site | null>(null);
  const [slug, setSlug] = useState(slugify(suggestion).slice(0, 40));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api<{ sites: Site[] }>("/api/sites")
      .then(({ sites }) => {
        const s = sites.find((x) => x.project_id === projectId) || null;
        setSite(s);
        if (s) setSlug(s.slug);
      })
      .catch(() => undefined);
  }, [projectId]);

  const publish = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await api<{ id: string; url: string }>("/api/sites", { projectId, slug });
      setSite({ id: r.id, project_id: projectId, slug, url: r.url, views: site?.views || 0 });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-bold">🚀 Mettre en ligne</span>
        {site && <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">En ligne · {site.views} vues</span>}
      </div>
      <div>
        <label className="label">Adresse de la page</label>
        <input className="input" value={slug} onChange={(e) => setSlug(slugify(e.target.value).slice(0, 40))} placeholder="mon-produit" />
      </div>
      <button className="btn-primary w-full" onClick={publish} disabled={busy || slug.length < 3}>
        {busy ? "Publication…" : site ? "Mettre à jour la page en ligne" : "Publier maintenant"}
      </button>
      {site && (
        <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-2">
          <a href={site.url} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate text-sm font-semibold text-brand-700 underline">
            {site.url}
          </a>
          <button
            className="btn-ghost px-2 py-1 text-xs"
            onClick={async () => {
              await navigator.clipboard.writeText(site.url);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
          >
            {copied ? "✓" : "Copier"}
          </button>
        </div>
      )}
      <p className="text-xs text-gray-500">
        Les modifications faites dans l&apos;éditeur sont mises en ligne automatiquement. Domaine personnalisé : page{" "}
        <a href="/studio/publications" className="text-brand-600 underline">
          Mes pages en ligne
        </a>
        .
      </p>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}
