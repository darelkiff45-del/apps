"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/ui";
import {
  api,
  clearLocalProjects,
  download,
  listLocalProjects,
  slugify,
  type LocalProject,
  type ProjectSummary,
  type ProjectType,
} from "@/lib/client";

const LABELS: Record<ProjectType, string> = {
  ebook: "📘 Ebook",
  template: "🗂️ Template",
  site: "🌐 Site vitrine",
  "sales-page": "💰 Page de vente",
  mockup: "🖼️ Couverture",
  video: "🎬 Vidéo",
};

type FullProject = { project: { title: string; type: ProjectType; data: unknown }; files: { name: string; url: string }[] };

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectSummary[] | null>(null);
  const [local, setLocal] = useState<LocalProject[]>([]);
  const [filter, setFilter] = useState<ProjectType | "all">("all");
  const [open, setOpen] = useState<{ id: string; full: FullProject | null } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api<{ projects: ProjectSummary[] }>("/api/projects")
      .then((r) => setProjects(r.projects))
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    load();
    setLocal(listLocalProjects());
  }, [load]);

  const importLocal = async () => {
    for (const p of local) {
      await api("/api/projects", { type: p.type, title: p.title, data: typeof p.data === "string" ? { html: p.data } : p.data });
    }
    clearLocalProjects();
    setLocal([]);
    load();
  };

  const toggle = async (id: string) => {
    if (open?.id === id) return setOpen(null);
    setOpen({ id, full: null });
    try {
      setOpen({ id, full: await api<FullProject>(`/api/projects/${id}`) });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const exportProject = ({ project }: FullProject) => {
    const data = project.data as { html?: string };
    if (data?.html) download(`${slugify(project.title)}.html`, data.html);
    else download(`${slugify(project.title)}.json`, JSON.stringify(project.data, null, 2), "application/json");
  };

  const shown = (projects || []).filter((p) => filter === "all" || p.type === filter);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader icon="📁" title="Mes projets" desc="Tout ce que tu as généré, sauvegardé dans le cloud et accessible depuis n'importe quel appareil." />
      {local.length > 0 && (
        <div className="card mb-4 flex flex-wrap items-center gap-3 border-brand-100 bg-brand-50">
          <span className="flex-1 text-sm">
            {local.length} projet{local.length > 1 ? "s" : ""} de la V1 {local.length > 1 ? "sont" : "est"} encore dans ce navigateur.
          </span>
          <button className="btn-primary py-1 text-xs" onClick={importLocal}>
            Importer dans le cloud
          </button>
        </div>
      )}
      <div className="mb-4 flex flex-wrap gap-2">
        {(["all", ...(Object.keys(LABELS) as ProjectType[])] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${filter === t ? "bg-gray-900 text-white" : "bg-white text-gray-600"}`}
          >
            {t === "all" ? "Tous" : LABELS[t]}
          </button>
        ))}
      </div>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      <div className="card p-0">
        {projects === null ? (
          <p className="p-6 text-sm text-gray-400">Chargement…</p>
        ) : shown.length === 0 ? (
          <p className="p-6 text-sm text-gray-400">Aucun projet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {shown.map((p) => (
              <li key={p.id} className="p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="w-32 text-xs font-semibold text-gray-500">{LABELS[p.type]}</span>
                  <button className="min-w-0 flex-1 truncate text-left font-medium hover:text-brand-600" onClick={() => toggle(p.id)}>
                    {p.title}
                  </button>
                  {p.files.length > 0 && <span className="text-xs text-gray-400">☁️ {p.files.length}</span>}
                  <span className="text-xs text-gray-400">{new Date(p.created_at).toLocaleString("fr-FR")}</span>
                  <button
                    className="py-1 text-xs text-red-500"
                    onClick={async () => {
                      if (!confirm("Supprimer ce projet et ses fichiers ?")) return;
                      await api(`/api/projects/${p.id}`, undefined, "DELETE");
                      load();
                    }}
                  >
                    Supprimer
                  </button>
                </div>
                {open?.id === p.id && (
                  <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm">
                    {!open.full ? (
                      "Chargement…"
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <button className="btn-ghost py-1 text-xs" onClick={() => exportProject(open.full!)}>
                          Télécharger le contenu
                        </button>
                        {open.full.files.map((f) => (
                          <a key={f.url} href={f.url} target="_blank" rel="noreferrer" className="btn-ghost py-1 text-xs">
                            ⬇ {f.name}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
