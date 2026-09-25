"use client";

import { useState } from "react";
import { BriefForm } from "@/components/BriefForm";
import { HtmlPreview } from "@/components/HtmlPreview";
import { EmptyState, ErrorBox, GenerateButton, PageHeader } from "@/components/ui";
import { saveProject, slugify, useBrief, useGenerate, useStored } from "@/lib/client";

const ALL_SECTIONS = ["Accueil", "À propos", "Services", "Produits", "Portfolio", "Témoignages", "Tarifs", "FAQ", "Blog", "Contact"];

export default function SitePage() {
  const [brief] = useBrief();
  const [html, setHtml] = useStored<string | null>("last-site", null);
  const [business, setBusiness] = useState("");
  const [style, setStyle] = useState("moderne et épuré");
  const [contact, setContact] = useState("");
  const [sections, setSections] = useState(["Accueil", "À propos", "Services", "Témoignages", "FAQ", "Contact"]);
  const { run, loading, error } = useGenerate<{ html: string }>();

  const generate = async () => {
    const res = await run("/api/site", { brief, business, sections, style, contact });
    if (res) {
      setHtml(res.html);
      saveProject("site", business || brief.name || "Site vitrine", res.html);
    }
  };

  return (
    <div>
      <PageHeader icon="🌐" title="Site vitrine" desc="Un site one-page professionnel, responsive, prêt à mettre en ligne." />
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="space-y-4">
          <BriefForm compact />
          <div className="card space-y-3">
            <div>
              <label className="label">Ton activité</label>
              <textarea className="input" rows={2} placeholder="Ex. Coach business pour entrepreneurs africains" value={business} onChange={(e) => setBusiness(e.target.value)} />
            </div>
            <div>
              <label className="label">Style visuel</label>
              <input className="input" value={style} onChange={(e) => setStyle(e.target.value)} />
            </div>
            <div>
              <label className="label">Sections</label>
              <div className="flex flex-wrap gap-2">
                {ALL_SECTIONS.map((s) => {
                  const on = sections.includes(s);
                  return (
                    <button
                      key={s}
                      onClick={() => setSections(on ? sections.filter((x) => x !== s) : [...sections, s])}
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${on ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600"}`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="label">Coordonnées (optionnel)</label>
              <input className="input" placeholder="WhatsApp, email, ville…" value={contact} onChange={(e) => setContact(e.target.value)} />
            </div>
            <GenerateButton loading={loading} onClick={generate}>
              ✨ Créer le site
            </GenerateButton>
            <ErrorBox error={error} />
          </div>
        </div>
        <div>{html ? <HtmlPreview html={html} filename={`site-${slugify(business || brief.name)}.html`} /> : <EmptyState text="L'aperçu de ton site apparaîtra ici." />}</div>
      </div>
    </div>
  );
}
