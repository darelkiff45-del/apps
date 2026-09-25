import "server-only";
import { AIError } from "./ai";
import { appUrl } from "./billing";
import { createAdmin } from "./supabase/server";

export const RESERVED_SLUGS = new Set(["www", "app", "api", "admin", "studio", "mail", "blog", "aide", "help", "support", "status", "docs"]);

export const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/;

/** Adresse publique d'une page : sous-domaine si un domaine de pages est configuré, sinon /p/slug. */
export function pageUrl(slug: string) {
  const domain = process.env.NEXT_PUBLIC_PAGES_DOMAIN;
  return domain ? `https://${slug}.${domain}` : `${appUrl()}/p/${slug}`;
}

const BADGE = `<a href="${"__APP__"}" target="_blank" rel="noopener" style="position:fixed;bottom:12px;right:12px;z-index:2147483647;background:#111827;color:#fff;font:600 12px/1 system-ui,sans-serif;padding:8px 12px;border-radius:999px;text-decoration:none;box-shadow:0 4px 14px rgba(0,0,0,.25)">✦ Créé avec Créateur Digital</a>`;

/** Badge ajouté aux pages publiées avec la formule gratuite. */
export function withBadge(html: string) {
  const badge = BADGE.replace("__APP__", appUrl());
  return html.includes("</body>") ? html.replace(/<\/body>(?![\s\S]*<\/body>)/, badge + "</body>") : html + badge;
}

/**
 * Sert une page publiée. L'en-tête CSP « sandbox » isole la page dans une origine opaque :
 * même servie sur le domaine de l'app, son code ne peut pas lire les cookies de session.
 */
export async function servePage(where: { slug: string } | { host: string }) {
  const admin = createAdmin();
  let query = admin.from("sites").select("id, html");
  if ("slug" in where) query = query.eq("slug", where.slug);
  else {
    const domain = process.env.NEXT_PUBLIC_PAGES_DOMAIN;
    const host = where.host.toLowerCase().replace(/:\d+$/, "");
    query = domain && host.endsWith(`.${domain}`) ? query.eq("slug", host.slice(0, -domain.length - 1)) : query.eq("custom_domain", host);
  }
  const { data } = await query.maybeSingle();
  if (!data) {
    return new Response(
      `<!DOCTYPE html><html lang="fr"><meta charset="utf-8"><title>Page introuvable</title><body style="font-family:system-ui;display:grid;place-items:center;height:100vh;margin:0;color:#374151"><div style="text-align:center"><h1>Page introuvable</h1><p>Cette page n'existe pas ou n'est plus publiée.</p></div></body></html>`,
      { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  }
  admin.rpc("increment_site_views", { p_id: data.id }).then(() => undefined);
  return new Response(data.html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy": "sandbox allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "public, max-age=60, s-maxage=60",
    },
  });
}

/* ------------------------ Domaines personnalisés (Vercel) ------------------------ */

function vercel() {
  const token = process.env.VERCEL_TOKEN;
  const project = process.env.VERCEL_PROJECT_ID;
  if (!token || !project) throw new AIError("Domaines personnalisés non configurés (VERCEL_TOKEN / VERCEL_PROJECT_ID).", 503);
  const team = process.env.VERCEL_TEAM_ID ? `?teamId=${process.env.VERCEL_TEAM_ID}` : "";
  const call = async (path: string, init?: RequestInit) => {
    const res = await fetch(`https://api.vercel.com${path}${team}`, {
      ...init,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
    const json = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, json };
  };
  return { project, call };
}

export const DOMAIN_RE = /^(?!-)([a-z0-9-]{1,63}\.)+[a-z]{2,24}$/;

export async function addDomain(domain: string) {
  const { project, call } = vercel();
  const r = await call(`/v10/projects/${project}/domains`, { method: "POST", body: JSON.stringify({ name: domain }) });
  if (!r.ok && r.json?.error?.code !== "domain_already_in_use_by_project") {
    throw new AIError(`Vercel : ${r.json?.error?.message || "impossible d'ajouter le domaine"}`, 400);
  }
}

export async function removeDomain(domain: string) {
  const { project, call } = vercel();
  await call(`/v9/projects/${project}/domains/${domain}`, { method: "DELETE" });
}

/** État du domaine + enregistrements DNS à créer chez le registraire. */
export async function domainStatus(domain: string) {
  const { project, call } = vercel();
  const [info, config] = await Promise.all([
    call(`/v9/projects/${project}/domains/${domain}`),
    call(`/v6/domains/${domain}/config`),
  ]);
  const apex = domain.split(".").length === 2;
  const records = [
    apex
      ? { type: "A", name: "@", value: "76.76.21.21" }
      : { type: "CNAME", name: domain.split(".").slice(0, -2).join("."), value: "cname.vercel-dns.com" },
    ...((info.json?.verification as { type: string; domain: string; value: string }[] | undefined) || []).map((v) => ({
      type: v.type,
      name: v.domain,
      value: v.value,
    })),
  ];
  const ready = Boolean(info.json?.verified) && config.json?.misconfigured === false;
  return { ready, records };
}
