"use client";

import { useState } from "react";
import type { Brief } from "@/lib/brief";
import { useBrief } from "@/lib/client";

const FIELDS: { key: keyof Brief; label: string; placeholder: string; long?: boolean }[] = [
  { key: "name", label: "Nom du produit", placeholder: "Ex. Le Guide du Freelance Rentable" },
  { key: "niche", label: "Niche / sujet", placeholder: "Ex. freelancing, graphisme, développement personnel" },
  { key: "audience", label: "Client idéal", placeholder: "Ex. étudiants et salariés qui veulent un revenu en ligne", long: true },
  { key: "promise", label: "Promesse / transformation", placeholder: "Ex. décrocher 3 premiers clients en 30 jours", long: true },
  { key: "price", label: "Prix", placeholder: "Ex. 15 000 FCFA / 27 €" },
  { key: "tone", label: "Ton", placeholder: "Ex. inspirant et direct" },
  { key: "language", label: "Langue", placeholder: "français" },
];

/** Fiche produit partagée entre tous les modules (sauvegardée dans le navigateur). */
export function BriefForm({ compact = false }: { compact?: boolean }) {
  const [brief, setBrief] = useBrief();
  const [open, setOpen] = useState(!compact);
  const filled = brief.name || brief.niche;

  return (
    <div className="card">
      <button className="flex w-full items-center justify-between text-left" onClick={() => setOpen(!open)}>
        <div>
          <div className="font-bold">🧾 Fiche produit</div>
          <div className="text-xs text-gray-500">
            {filled ? `${brief.name || "Sans nom"} — ${brief.niche}` : "Remplis-la une fois, elle sert à tous les modules"}
          </div>
        </div>
        <span className="text-gray-400">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="mt-4 grid gap-3">
          {FIELDS.map((f) => (
            <div key={f.key}>
              <label className="label">{f.label}</label>
              {f.long ? (
                <textarea
                  className="input"
                  rows={2}
                  placeholder={f.placeholder}
                  value={brief[f.key]}
                  onChange={(e) => setBrief({ ...brief, [f.key]: e.target.value })}
                />
              ) : (
                <input
                  className="input"
                  placeholder={f.placeholder}
                  value={brief[f.key]}
                  onChange={(e) => setBrief({ ...brief, [f.key]: e.target.value })}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
