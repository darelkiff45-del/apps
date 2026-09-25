"use client";

import { useState } from "react";
import { BriefForm } from "@/components/BriefForm";
import { HtmlWorkspace, type HtmlResult } from "@/components/HtmlWorkspace";
import { VariantToggle } from "@/components/Options";
import { EmptyState, ErrorBox, GenerateButton, PageHeader } from "@/components/ui";
import { slugify, useBrief, useGenerate, useStored } from "@/lib/client";
import { TEMPLATE_KINDS } from "@/lib/constants";
import { COSTS } from "@/lib/plans";

export default function TemplatesPage() {
  const [brief] = useBrief();
  const [result, setResult] = useStored<HtmlResult | null>("last-template-v2", null);
  const [count, setCount] = useState<1 | 3>(1);
  const [kind, setKind] = useState<(typeof TEMPLATE_KINDS)[number]>(TEMPLATE_KINDS[0]);
  const [pages, setPages] = useState(3);
  const [details, setDetails] = useState("");
  const { run, loading, error } = useGenerate<HtmlResult>();

  const generate = async () => {
    const res = await run("/api/template", { brief, kind, pages, details, variants: count });
    if (res) {
      setResult(res);
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
            <VariantToggle value={count} onChange={setCount} />
            <GenerateButton loading={loading} onClick={generate}>
              ✨ Créer le template · {COSTS.template * count} crédits
            </GenerateButton>
            <ErrorBox error={error} />
          </div>
        </div>
        <div>
          {result ? (
            <HtmlWorkspace result={result} onChange={setResult} filename={`template-${slugify(kind)}.html`} title={kind} printable />
          ) : (
            <EmptyState text="Ton template imprimable apparaîtra ici. Exporte-le en PDF pour le vendre." />
          )}
        </div>
      </div>
    </div>
  );
}
