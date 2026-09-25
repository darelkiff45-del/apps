"use client";

import { useState } from "react";
import { BriefForm } from "@/components/BriefForm";
import { HtmlPreview } from "@/components/HtmlPreview";
import { EmptyState, ErrorBox, GenerateButton, PageHeader } from "@/components/ui";
import { saveProject, slugify, useBrief, useGenerate, useStored } from "@/lib/client";

const FRAMEWORKS = [
  { id: "PAS", label: "PAS — Problème, Agitation, Solution" },
  { id: "AIDA", label: "AIDA — Attention, Intérêt, Désir, Action" },
  { id: "Storytelling (Hero's journey)", label: "Storytelling — le parcours du héros" },
];

export default function SalesPage() {
  const [brief, , briefReady] = useBrief();
  const [html, setHtml] = useStored<string | null>("last-sales-page", null);
  const [coverImage, setCoverImage] = useStored<string | null>("cover-image", null);
  const [framework, setFramework] = useState(FRAMEWORKS[0].id);
  const [bonuses, setBonuses] = useState("");
  const [guarantee, setGuarantee] = useState("Satisfait ou remboursé 7 jours");
  const [checkoutUrl, setCheckoutUrl] = useState("");
  const { run, loading, error, setError } = useGenerate<{ html: string }>();

  const generate = async () => {
    if (briefReady && !brief.promise) return setError("Ajoute la promesse / transformation dans la fiche produit : c'est le cœur de la page de vente.");
    const res = await run("/api/sales-page", {
      brief,
      framework,
      bonuses,
      guarantee,
      checkoutUrl: checkoutUrl || "#",
      coverImage: coverImage || undefined,
    });
    if (res) {
      setHtml(res.html);
      saveProject("sales-page", `Page de vente — ${brief.name || "produit"}`, res.html);
    }
  };

  return (
    <div>
      <PageHeader icon="💰" title="Page de vente" desc="Une page de vente persuasive, construite sur les frameworks de copywriting qui convertissent." />
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="space-y-4">
          <BriefForm compact />
          <div className="card space-y-3">
            <div>
              <label className="label">Structure</label>
              <select className="input" value={framework} onChange={(e) => setFramework(e.target.value)}>
                {FRAMEWORKS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Bonus (optionnel)</label>
              <textarea className="input" rows={2} placeholder="Ex. checklist PDF + accès au groupe WhatsApp" value={bonuses} onChange={(e) => setBonuses(e.target.value)} />
            </div>
            <div>
              <label className="label">Garantie</label>
              <input className="input" value={guarantee} onChange={(e) => setGuarantee(e.target.value)} />
            </div>
            <div>
              <label className="label">Lien de paiement</label>
              <input className="input" placeholder="https://… (Chariow, Gumroad, Stripe…)" value={checkoutUrl} onChange={(e) => setCheckoutUrl(e.target.value)} />
            </div>
            {coverImage ? (
              <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={coverImage} alt="Mockup" className="h-14 w-14 rounded object-contain" />
                <span className="flex-1 text-xs text-gray-600">Mockup intégré au hero</span>
                <button className="text-xs text-red-500" onClick={() => setCoverImage(null)}>
                  Retirer
                </button>
              </div>
            ) : (
              <p className="text-xs text-gray-500">Astuce : dans « Mockups », clique « Utiliser sur la page de vente » pour afficher ton produit.</p>
            )}
            <GenerateButton loading={loading} onClick={generate}>
              ✨ Écrire la page de vente
            </GenerateButton>
            <ErrorBox error={error} />
          </div>
        </div>
        <div>{html ? <HtmlPreview html={html} filename={`page-de-vente-${slugify(brief.name)}.html`} /> : <EmptyState text="Ta page de vente apparaîtra ici." />}</div>
      </div>
    </div>
  );
}
