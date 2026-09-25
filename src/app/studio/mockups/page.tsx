"use client";

import { useState } from "react";
import type { CoverDesignResult } from "@/app/api/mockup/route";
import { BriefForm } from "@/components/BriefForm";
import type { CoverDesign } from "@/components/Cover";
import { MockupGallery } from "@/components/Mockups";
import { EmptyState, ErrorBox, GenerateButton, PageHeader } from "@/components/ui";
import { saveProject, slugify, useBrief, useGenerate, useStored } from "@/lib/client";

const COLOR_FIELDS: [keyof CoverDesign, string][] = [
  ["background", "Fond"],
  ["backgroundEnd", "Dégradé"],
  ["accent", "Accent"],
  ["text", "Texte"],
];

export default function MockupsPage() {
  const [brief] = useBrief();
  const [design, setDesign] = useStored<CoverDesign | null>("cover-design", null);
  const [, setCoverImage] = useStored<string | null>("cover-image", null);
  const [productType, setProductType] = useState("ebook");
  const [notice, setNotice] = useState<string | null>(null);
  const { run, loading, error } = useGenerate<CoverDesignResult>();

  const generate = async () => {
    const res = await run("/api/mockup", { brief, productType });
    if (res) {
      setDesign(res);
      saveProject("mockup", res.title, res);
    }
  };

  return (
    <div>
      <PageHeader icon="🖼️" title="Mockups & visuels pub" desc="L'IA conçoit ta couverture, puis la décline en mockups 3D et visuels prêts à publier." />
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="space-y-4">
          <BriefForm compact />
          <div className="card space-y-3">
            <div>
              <label className="label">Type de produit</label>
              <select className="input" value={productType} onChange={(e) => setProductType(e.target.value)}>
                <option>ebook</option>
                <option>guide PDF</option>
                <option>pack de templates</option>
                <option>formation en ligne</option>
                <option>workbook</option>
              </select>
            </div>
            <GenerateButton loading={loading} onClick={generate}>
              ✨ {design ? "Nouvelle couverture" : "Générer la couverture"}
            </GenerateButton>
            <ErrorBox error={error} />
          </div>
          {design && (
            <div className="card space-y-3">
              <div className="font-bold">✏️ Personnaliser</div>
              <div>
                <label className="label">Titre</label>
                <input className="input" value={design.title} onChange={(e) => setDesign({ ...design, title: e.target.value })} />
              </div>
              <div>
                <label className="label">Sous-titre</label>
                <textarea className="input" rows={2} value={design.subtitle} onChange={(e) => setDesign({ ...design, subtitle: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Badge</label>
                  <input className="input" value={design.badge} onChange={(e) => setDesign({ ...design, badge: e.target.value })} />
                </div>
                <div>
                  <label className="label">Auteur</label>
                  <input className="input" value={design.author} onChange={(e) => setDesign({ ...design, author: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {COLOR_FIELDS.map(([k, label]) => (
                  <label key={k} className="text-center text-xs text-gray-500">
                    <input
                      type="color"
                      className="h-10 w-full cursor-pointer rounded"
                      value={design[k] as string}
                      onChange={(e) => setDesign({ ...design, [k]: e.target.value })}
                    />
                    {label}
                  </label>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Police</label>
                  <select className="input" value={design.fontFamily} onChange={(e) => setDesign({ ...design, fontFamily: e.target.value as CoverDesign["fontFamily"] })}>
                    {["Poppins", "Playfair Display", "Montserrat", "Bebas Neue", "Lora"].map((f) => (
                      <option key={f}>{f}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Motif</label>
                  <select className="input" value={design.pattern} onChange={(e) => setDesign({ ...design, pattern: e.target.value as CoverDesign["pattern"] })}>
                    {["none", "dots", "grid", "waves", "circles"].map((f) => (
                      <option key={f}>{f}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Accroches pub</label>
                {design.headlines.map((h, i) => (
                  <input
                    key={i}
                    className="input mb-2"
                    value={h}
                    onChange={(e) => {
                      const headlines = [...design.headlines];
                      headlines[i] = e.target.value;
                      setDesign({ ...design, headlines });
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        <div>
          {notice && <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">{notice}</div>}
          {design ? (
            <MockupGallery
              design={design}
              price={brief.price}
              filename={slugify(design.title)}
              onUseForSales={(url) => {
                setCoverImage(url);
                setNotice("✓ Mockup enregistré : il sera intégré à ta prochaine page de vente.");
              }}
            />
          ) : (
            <EmptyState text="Remplis ta fiche produit puis génère ta couverture : les mockups apparaîtront ici." />
          )}
        </div>
      </div>
    </div>
  );
}
