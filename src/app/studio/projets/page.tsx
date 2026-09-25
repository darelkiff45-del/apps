"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui";
import { deleteProject, download, listProjects, slugify, type Project, type ProjectType } from "@/lib/client";

const LABELS: Record<ProjectType, string> = {
  ebook: "📘 Ebook",
  template: "🗂️ Template",
  site: "🌐 Site vitrine",
  "sales-page": "💰 Page de vente",
  mockup: "🖼️ Couverture",
  video: "🎬 Vidéo",
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filter, setFilter] = useState<ProjectType | "all">("all");
  useEffect(() => setProjects(listProjects()), []);

  const shown = filter === "all" ? projects : projects.filter((p) => p.type === filter);

  const exportProject = (p: Project) => {
    if (typeof p.data === "string") download(`${slugify(p.title)}.html`, p.data);
    else download(`${slugify(p.title)}.json`, JSON.stringify(p.data, null, 2), "application/json");
  };

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader icon="📁" title="Mes projets" desc="Tout ce que tu as généré. (V1 : stocké dans ce navigateur — la V2 ajoutera le cloud.)" />
      <div className="mb-4 flex flex-wrap gap-2">
        {(["all", ...Object.keys(LABELS)] as (ProjectType | "all")[]).map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${filter === t ? "bg-gray-900 text-white" : "bg-white text-gray-600"}`}
          >
            {t === "all" ? "Tous" : LABELS[t]}
          </button>
        ))}
      </div>
      <div className="card p-0">
        {shown.length === 0 ? (
          <p className="p-6 text-sm text-gray-400">Aucun projet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {shown.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-3 p-4">
                <span className="w-32 text-xs font-semibold text-gray-500">{LABELS[p.type]}</span>
                <span className="min-w-0 flex-1 truncate font-medium">{p.title}</span>
                <span className="text-xs text-gray-400">{new Date(p.createdAt).toLocaleString("fr-FR")}</span>
                <button className="btn-ghost py-1 text-xs" onClick={() => exportProject(p)}>
                  Télécharger
                </button>
                <button
                  className="py-1 text-xs text-red-500"
                  onClick={() => {
                    deleteProject(p.id);
                    setProjects(listProjects());
                  }}
                >
                  Supprimer
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
