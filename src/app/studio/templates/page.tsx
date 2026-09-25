"use client";

import { useState } from "react";
import { BriefForm } from "@/components/BriefForm";
import { HtmlPreview } from "@/components/HtmlPreview";
import { EmptyState, ErrorBox, GenerateButton, PageHeader } from "@/components/ui";
import { slugify, useBrief, useGenerate, useStored } from "@/lib/client";
import { TEMPLATE_KINDS } from "@/lib/constants";
import { COSTS } from "@/lib/plans";

export default function TemplatesPage() {
  const [brief] = useBrief();
  const [html, setHtml] = useStored<string | null>("last-template", null);
  const [kind, setKind] = useState<(typeof TEMPLATE_KINDS)[number]>(TEMPLATE_KINDS[0]);
  const [pages, setPages] = useState(3);
  const [details, setDetails] = useState("");
  const { run, loading, error } = useGenerate<{ html: string }>();

  const generate = async () => {
    const res = await run("/api/template", { brief, kind, pages, details });
    if (res) {
      setHtml(res.html);
    }
  };

  return (
    <div>
      <PageHeader icon="🗂️" title="Générateur de templates" desc="Des templates imprimables (A4) à vendre sur ta boutique : planners, checklists, workbooks…" />
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="space-y-4">
          <BriefForm compact />
          <div className="card space-y-3">
            <div>
              <label className="label">Type de template</label>
              <select className="input" value={kind} onChange={(e) => setKind(e.target.value as typeof kind)}>
                {TEMPLATE_KINDS.map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Nombre de pages</label>
              <input type="number" min={1} max={8} className="input" value={pages} onChange={(e) => setPages(Number(e.target.value))} />
            </div>
            <div>
              <label className="label">Précisions (optionnel)</label>
              <textarea className="input" rows={3} placeholder="Ex. planner mensuel 2026, couleurs pastel, style minimaliste" value={details} onChange={(e) => setDetails(e.target.value)} />
            </div>
            <GenerateButton loading={loading} onClick={generate}>
              ✨ Créer le template · {COSTS.template} crédits
            </GenerateButton>
            <ErrorBox error={error} />
          </div>
        </div>
        <div>
          {html ? (
            <HtmlPreview html={html} filename={`template-${slugify(kind)}.html`} printable />
          ) : (
            <EmptyState text="Ton template imprimable apparaîtra ici. Exporte-le en PDF pour le vendre." />
          )}
        </div>
      </div>
    </div>
  );
}
