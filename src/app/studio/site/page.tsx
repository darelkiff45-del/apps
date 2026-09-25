"use client";

import { useState } from "react";
import { BriefForm } from "@/components/BriefForm";
import { HtmlWorkspace, type HtmlResult } from "@/components/HtmlWorkspace";
import { Toggle, VariantToggle } from "@/components/Options";
import { EmptyState, ErrorBox, GenerateButton, PageHeader } from "@/components/ui";
import { slugify, useBrief, useGenerate, useStored } from "@/lib/client";
import { COSTS, MAX_AUTO_IMAGES } from "@/lib/plans";

const ALL_SECTIONS = ["Accueil", "À propos", "Services", "Produits", "Portfolio", "Témoignages", "Tarifs", "FAQ", "Blog", "Contact"];

export default function SitePage() {
  const [brief] = useBrief();
  const [result, setResult] = useStored<HtmlResult | null>("last-site-v2", null);
  const [count, setCount] = useState<1 | 3>(1);
  const [aiImages, setAiImages] = useState(false);
  const [business, setBusiness] = useState("");
  const [style, setStyle] = useState("moderne et épuré");
  const [contact, setContact] = useState("");
  const [sections, setSections] = useState(["Accueil", "À propos", "Services", "Témoignages", "FAQ", "Contact"]);
  const { run, loading, error } = useGenerate<HtmlResult>();
  const cost = (COSTS.site + (aiImages ? MAX_AUTO_IMAGES * COSTS.image : 0)) * count;

  const generate = async () => {
    const res = await run("/api/site", { brief, business, sections, style, contact, variants: count, aiImages });
    if (res) {
      setResult(res);
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
            <VariantToggle value={count} onChange={setCount} />
            <Toggle checked={aiImages} onChange={setAiImages} label="Images générées par IA" hint={`Jusqu'à ${MAX_AUTO_IMAGES} images uniques (Higgsfield) au lieu de photos de banque d'images.`} />
            <GenerateButton loading={loading} onClick={generate}>
              ✨ Créer le site · {cost} crédits
            </GenerateButton>
            <ErrorBox error={error} />
          </div>
        </div>
        <div>
          {result ? (
            <HtmlWorkspace
              result={result}
              onChange={setResult}
              filename={`site-${slugify(business || brief.name)}.html`}
              title={business || brief.name || "mon-site"}
              publishable
            />
          ) : (
            <EmptyState text="L'aperçu de ton site apparaîtra ici." />
          )}
        </div>
      </div>
    </div>
  );
}
