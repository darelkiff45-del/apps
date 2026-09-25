"use client";

import { useState } from "react";
import type { EbookResult } from "@/app/api/ebook/route";
import { BriefForm } from "@/components/BriefForm";
import type { CoverDesign } from "@/components/Cover";
import { HtmlPreview } from "@/components/HtmlPreview";
import { EmptyState, ErrorBox, GenerateButton, PageHeader } from "@/components/ui";
import { saveProject, slugify, useBrief, useGenerate, useStored } from "@/lib/client";
import { ebookToHtml } from "@/lib/ebook";

export default function EbookPage() {
  const [brief] = useBrief();
  const [cover] = useStored<CoverDesign | null>("cover-design", null);
  const [ebook, setEbook] = useStored<EbookResult | null>("last-ebook", null);
  const [chapters, setChapters] = useState(6);
  const [length, setLength] = useState<"court" | "moyen" | "long">("moyen");
  const [author, setAuthor] = useState("");
  const { run, loading, error, setError } = useGenerate<EbookResult>();

  const generate = async () => {
    if (!brief.niche && !brief.name) return setError("Indique au moins le nom ou la niche dans la fiche produit.");
    const res = await run("/api/ebook", { brief, chapters, length });
    if (res) {
      setEbook(res);
      saveProject("ebook", res.title, res);
    }
  };

  return (
    <div>
      <PageHeader icon="📘" title="Générateur d'ebook" desc="Un ebook complet avec couverture, sommaire, chapitres et appel à l'action — exportable en PDF." />
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <div className="space-y-4">
          <BriefForm compact />
          <div className="card space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Chapitres</label>
                <input type="number" min={3} max={12} className="input" value={chapters} onChange={(e) => setChapters(Number(e.target.value))} />
              </div>
              <div>
                <label className="label">Longueur</label>
                <select className="input" value={length} onChange={(e) => setLength(e.target.value as typeof length)}>
                  <option value="court">Court</option>
                  <option value="moyen">Moyen</option>
                  <option value="long">Long</option>
                </select>
              </div>
            </div>
            <div>
              <label className="label">Nom de l&apos;auteur</label>
              <input className="input" placeholder="Ton nom ou ta marque" value={author} onChange={(e) => setAuthor(e.target.value)} />
            </div>
            <p className="text-xs text-gray-500">
              {cover ? "✓ La couverture créée dans « Mockups » sera utilisée." : "Astuce : crée d'abord ta couverture dans « Mockups & visuels »."}
            </p>
            <GenerateButton loading={loading} onClick={generate} loadingLabel="Rédaction en cours… (1 à 4 min)">
              ✨ Écrire l&apos;ebook
            </GenerateButton>
            <ErrorBox error={error} />
          </div>
        </div>
        <div>
          {ebook ? (
            <HtmlPreview html={ebookToHtml(ebook, cover, author)} filename={`${slugify(ebook.title)}.html`} printable />
          ) : (
            <EmptyState text="Ton ebook apparaîtra ici, prêt à être exporté en PDF." />
          )}
        </div>
      </div>
    </div>
  );
}
