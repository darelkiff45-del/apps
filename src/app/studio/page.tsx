"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BriefForm } from "@/components/BriefForm";
import { PageHeader } from "@/components/ui";
import { api, type ProjectSummary } from "@/lib/client";
import { MODULES } from "@/lib/modules";

const STEPS = [
  { href: "/studio/ebook", label: "Crée le produit (ebook ou template)" },
  { href: "/studio/mockups", label: "Génère la couverture et les mockups" },
  { href: "/studio/page-de-vente", label: "Écris la page de vente" },
  { href: "/studio/videos", label: "Lance les vidéos pub UGC" },
];

export default function Dashboard() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  useEffect(() => {
    api<{ projects: ProjectSummary[] }>("/api/projects")
      .then((r) => setProjects(r.projects))
      .catch(() => setProjects([]));
  }, []);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader icon="👋" title="Ton studio" desc="Remplis ta fiche produit, puis suis le parcours : produit → visuels → vente → pub." />
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <div className="card">
            <div className="mb-3 font-bold">🚀 Parcours de lancement</div>
            <ol className="grid gap-2 sm:grid-cols-2">
              {STEPS.map((s, i) => (
                <li key={s.href}>
                  <Link href={s.href} className="flex items-center gap-3 rounded-lg bg-gray-50 p-3 text-sm font-medium hover:bg-brand-50">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-600 text-xs font-bold text-white">{i + 1}</span>
                    {s.label}
                  </Link>
                </li>
              ))}
            </ol>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {MODULES.map((m) => (
              <Link key={m.href} href={m.href} className="card transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="text-2xl">{m.icon}</div>
                <div className="mt-2 font-bold">{m.label}</div>
                <div className="text-sm text-gray-500">{m.desc}</div>
              </Link>
            ))}
          </div>
          <div className="card">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-bold">📁 Derniers projets</span>
              <Link href="/studio/projets" className="text-sm text-brand-600">
                Tout voir →
              </Link>
            </div>
            {projects.length === 0 ? (
              <p className="text-sm text-gray-400">Aucun projet pour l&apos;instant.</p>
            ) : (
              <ul className="divide-y divide-gray-100 text-sm">
                {projects.slice(0, 5).map((p) => (
                  <li key={p.id} className="flex justify-between py-2">
                    <span>{p.title}</span>
                    <span className="text-gray-400">{new Date(p.created_at).toLocaleDateString("fr-FR")}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div>
          <BriefForm />
        </div>
      </div>
    </div>
  );
}
