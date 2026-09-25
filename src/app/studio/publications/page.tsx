"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/ui";
import { api, useProfile } from "@/lib/client";
import { PLANS } from "@/lib/plans";

type Site = { id: string; title: string; slug: string; url: string; custom_domain: string | null; views: number; updated_at: string };
type DomainInfo = { domain: string | null; ready?: boolean; records?: { type: string; name: string; value: string }[] };

export default function PublicationsPage() {
  const profile = useProfile();
  const [sites, setSites] = useState<Site[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api<{ sites: Site[] }>("/api/sites")
      .then((r) => setSites(r.sites))
      .catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  const plan = profile ? PLANS[profile.plan] : null;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader icon="🚀" title="Mes pages en ligne" desc="Tes sites et pages de vente publiés, leurs visites et leurs adresses." />
      {plan && sites && (
        <p className="mb-4 text-sm text-gray-500">
          {sites.length} / {plan.pages} page{plan.pages > 1 ? "s" : ""} publiée{plan.pages > 1 ? "s" : ""} avec la formule {plan.name}.{" "}
          {sites.length >= plan.pages && (
            <Link href="/tarifs" className="font-semibold text-brand-600 underline">
              Augmenter la limite
            </Link>
          )}
        </p>
      )}
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      {sites === null ? (
        <p className="text-sm text-gray-400">Chargement…</p>
      ) : sites.length === 0 ? (
        <div className="card text-sm text-gray-500">
          Aucune page en ligne. Crée une{" "}
          <Link href="/studio/page-de-vente" className="text-brand-600 underline">
            page de vente
          </Link>{" "}
          ou un{" "}
          <Link href="/studio/site" className="text-brand-600 underline">
            site vitrine
          </Link>{" "}
          puis clique « Publier maintenant ».
        </div>
      ) : (
        <div className="space-y-4">
          {sites.map((s) => (
            <SiteCard key={s.id} site={s} canDomain={!!plan?.customDomain} onChange={load} />
          ))}
        </div>
      )}
    </div>
  );
}

function SiteCard({ site, canDomain, onChange }: { site: Site; canDomain: boolean; onChange: () => void }) {
  const [domain, setDomain] = useState(site.custom_domain || "");
  const [info, setInfo] = useState<DomainInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (site.custom_domain) api<DomainInfo>(`/api/sites/${site.id}/domain`).then(setInfo).catch(() => undefined);
  }, [site.id, site.custom_domain]);

  const act = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="truncate font-bold">{site.title || site.slug}</div>
          <a href={site.url} target="_blank" rel="noreferrer" className="text-sm text-brand-700 underline">
            {site.url}
          </a>
        </div>
        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold">👁 {site.views} vues</span>
        <button
          className="text-xs text-red-500"
          disabled={busy}
          onClick={() =>
            confirm("Dépublier cette page ? Elle ne sera plus accessible en ligne.") &&
            act(async () => {
              await api(`/api/sites/${site.id}`, undefined, "DELETE");
              onChange();
            })
          }
        >
          Dépublier
        </button>
      </div>

      <div className="rounded-lg bg-gray-50 p-3">
        <div className="label">Domaine personnalisé</div>
        {canDomain ? (
          <>
            <div className="flex gap-2">
              <input className="input" placeholder="www.monproduit.com" value={domain} onChange={(e) => setDomain(e.target.value)} />
              <button
                className="btn-primary shrink-0"
                disabled={busy || !domain}
                onClick={() => act(async () => setInfo(await api<DomainInfo>(`/api/sites/${site.id}/domain`, { domain })))}
              >
                Connecter
              </button>
              {info?.domain && (
                <button
                  className="btn-ghost shrink-0"
                  disabled={busy}
                  onClick={() =>
                    act(async () => {
                      await api(`/api/sites/${site.id}/domain`, undefined, "DELETE");
                      setInfo(null);
                      setDomain("");
                    })
                  }
                >
                  Retirer
                </button>
              )}
            </div>
            {info?.domain && (
              <div className="mt-3 text-sm">
                {info.ready ? (
                  <p className="font-semibold text-green-700">✓ {info.domain} est en ligne (HTTPS actif).</p>
                ) : (
                  <>
                    <p className="text-amber-700">En attente de configuration DNS. Ajoute ces enregistrements chez ton registraire (OVH, GoDaddy, Namecheap…) :</p>
                    <table className="mt-2 w-full text-left text-xs">
                      <thead>
                        <tr className="text-gray-500">
                          <th className="py-1">Type</th>
                          <th>Nom</th>
                          <th>Valeur</th>
                        </tr>
                      </thead>
                      <tbody className="font-mono">
                        {info.records?.map((r, i) => (
                          <tr key={i} className="border-t border-gray-200">
                            <td className="py-1">{r.type}</td>
                            <td>{r.name}</td>
                            <td className="break-all">{r.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <button className="btn-ghost mt-2 py-1 text-xs" disabled={busy} onClick={() => act(async () => setInfo(await api<DomainInfo>(`/api/sites/${site.id}/domain`)))}>
                      Vérifier à nouveau
                    </button>
                  </>
                )}
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-gray-500">
            Utilise ton propre nom de domaine avec la formule{" "}
            <Link href="/tarifs" className="font-semibold text-brand-600 underline">
              Business
            </Link>
            .
          </p>
        )}
      </div>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}
