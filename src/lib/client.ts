"use client";

import { useCallback, useEffect, useState } from "react";
import { emptyBrief, type Brief } from "./brief";

/* ---------- Stockage local (MVP : tout est gardé dans le navigateur) ---------- */

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function useStored<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(fallback);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setValue(read(key, fallback));
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const update = useCallback(
    (next: T) => {
      setValue(next);
      write(key, next);
    },
    [key],
  );
  return [value, update, ready] as const;
}

export function useBrief() {
  return useStored<Brief>("brief", emptyBrief);
}

/* ---------- Projets (cloud) ---------- */

export type ProjectType = "ebook" | "template" | "site" | "sales-page" | "mockup" | "video";

export type ProjectSummary = {
  id: string;
  type: ProjectType;
  title: string;
  files: string[];
  created_at: string;
};

/** Projets de la V1 restés dans le navigateur (à importer dans le cloud). */
export type LocalProject = { id: string; type: ProjectType; title: string; createdAt: number; data: unknown };

export function listLocalProjects(): LocalProject[] {
  return read<LocalProject[]>("projects", []);
}

export function clearLocalProjects() {
  try {
    localStorage.removeItem("projects");
  } catch {
    /* rien */
  }
}

/* ---------- Compte et crédits ---------- */

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  plan: "free" | "starter" | "pro" | "business";
  plan_expires_at: string | null;
  credits: number;
  credits_reset_at: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
};

const PROFILE_EVENT = "profile-changed";

/** Demande le rafraîchissement du solde de crédits affiché partout. */
export function refreshProfile() {
  window.dispatchEvent(new Event(PROFILE_EVENT));
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  useEffect(() => {
    let alive = true;
    const load = () =>
      api<{ profile: Profile }>("/api/me")
        .then((r) => alive && setProfile(r.profile))
        .catch(() => alive && setProfile(null));
    load();
    window.addEventListener(PROFILE_EVENT, load);
    return () => {
      alive = false;
      window.removeEventListener(PROFILE_EVENT, load);
    };
  }, []);
  return profile;
}

/* ---------- Appels API ---------- */

export async function api<T>(path: string, body?: unknown, method?: string): Promise<T> {
  const res = await fetch(path, {
    method: method || (body === undefined ? "GET" : "POST"),
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({ error: "Réponse invalide du serveur." }));
  if (!res.ok) throw new Error(json.error || "Erreur inconnue.");
  return json as T;
}

export function useGenerate<T>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = useCallback(async (path: string, body: unknown): Promise<T | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await api<T>(path, body);
      refreshProfile();
      return result;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);
  return { run, loading, error, setError };
}

/* ---------- Téléchargements ---------- */

export function download(filename: string, content: string | Blob, type = "text/html") {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function slugify(s: string) {
  return (
    s
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "produit"
  );
}
