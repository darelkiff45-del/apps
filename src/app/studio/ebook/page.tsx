"use client";

import { useState } from "react";
import type { EbookResult } from "@/app/api/ebook/route";
import { BriefForm } from "@/components/BriefForm";
import type { CoverDesign } from "@/components/Cover";
import { HtmlPreview } from "@/components/HtmlPreview";
import { EmptyState, ErrorBox, GenerateButton, PageHeader } from "@/components/ui";
import { api, slugify, useBrief, useGenerate, useStored } from "@/lib/client";
import { ebookToHtml } from "@/lib/ebook";
import { COSTS } from "@/lib/plans";

export default function EbookPage() {
  const [brief] = useBrief();
  const [cover] = useStored<CoverDesign | null>("cover-design", null);
  const [ebook, setEbook] = useStored<EbookResult | null>("last-ebook", null);
  const [projectId, setProjectId] = useStored<string | null>("last-ebook-project", null);
  const [editing, setEditing] = useState(false);
  const [chapters, setChapters] = useState(6);
  const [length, setLength] = useState<"court" | "moyen" | "long">("moyen");
  const [author, setAuthor] = useState("");
  const { run, loading, error, setError } = useGenerate<EbookResult & { projectId?: string | null }>();

  const generate = async () => {
    if (!brief.niche && !brief.name) return setError("Indique au moins le nom ou la niche dans la fiche produit.");
    const res = await run("/api/ebook", { brief, chapters, length });
    if (res) {
      const { projectId: id, ...book } = res;
      setEbook(book);
      setProjectId(id || null);
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
              ✨ Écrire l&apos;ebook · {COSTS.ebook} crédits
            </GenerateButton>
            <ErrorBox error={error} />
          </div>
        </div>
        <div>
          {ebook && editing ? (
            <EbookEditor
              ebook={ebook}
              onCancel={() => setEditing(false)}
              onSave={async (next) => {
                setEbook(next);
                if (projectId) await api(`/api/projects/${projectId}`, { title: next.title, data: next }, "PATCH");
                setEditing(false);
              }}
            />
          ) : ebook ? (
            <div className="space-y-3">
              <div className="flex justify-end">
                <button className="btn-ghost" onClick={() => setEditing(true)}>
                  ✏️ Modifier le texte
                </button>
              </div>
              <HtmlPreview html={ebookToHtml(ebook, cover, author)} filename={`${slugify(ebook.title)}.html`} printable />
            </div>
          ) : (
            <EmptyState text="Ton ebook apparaîtra ici, prêt à être exporté en PDF." />
          )}
        </div>
      </div>
    </div>
  );
}

function EbookEditor({ ebook, onSave, onCancel }: { ebook: EbookResult; onSave: (e: EbookResult) => Promise<void>; onCancel: () => void }) {
  const [draft, setDraft] = useState(ebook);
  const [saving, setSaving] = useState(false);
  const setChapter = (i: number, patch: Partial<EbookResult["chapters"][number]>) =>
    setDraft({ ...draft, chapters: draft.chapters.map((c, j) => (j === i ? { ...c, ...patch } : c)) });

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <span className="font-bold">✏️ Modifier l&apos;ebook</span>
        <div className="flex gap-2">
          <button className="btn-ghost py-1 text-xs" onClick={onCancel}>
            Annuler
          </button>
          <button
            className="btn-primary py-1 text-xs"
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              await onSave(draft).finally(() => setSaving(false));
            }}
          >
            {saving ? "Enregistrement…" : "💾 Enregistrer"}
          </button>
        </div>
      </div>
      <p className="text-xs text-gray-500">Mise en forme : ### sous-titre, **gras**, - liste.</p>
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="label">Titre</label>
          <input className="input" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
        </div>
        <div>
          <label className="label">Sous-titre</label>
          <input className="input" value={draft.subtitle} onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })} />
        </div>
      </div>
      <div>
        <label className="label">Introduction</label>
        <textarea className="input" rows={6} value={draft.introduction} onChange={(e) => setDraft({ ...draft, introduction: e.target.value })} />
      </div>
      {draft.chapters.map((c, i) => (
        <div key={i} className="space-y-2 rounded-lg bg-gray-50 p-3">
          <label className="label">Chapitre {i + 1}</label>
          <input className="input font-semibold" value={c.title} onChange={(e) => setChapter(i, { title: e.target.value })} />
          <textarea className="input" rows={10} value={c.content} onChange={(e) => setChapter(i, { content: e.target.value })} />
          <input className="input" value={c.actionStep} onChange={(e) => setChapter(i, { actionStep: e.target.value })} placeholder="Passe à l'action" />
        </div>
      ))}
      <div>
        <label className="label">Conclusion</label>
        <textarea className="input" rows={5} value={draft.conclusion} onChange={(e) => setDraft({ ...draft, conclusion: e.target.value })} />
      </div>
      <div>
        <label className="label">Appel à l&apos;action final</label>
        <input className="input" value={draft.callToAction} onChange={(e) => setDraft({ ...draft, callToAction: e.target.value })} />
      </div>
    </div>
  );
}
