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

/* ---------- Bibliothèque de projets ---------- */

export type ProjectType = "ebook" | "template" | "site" | "sales-page" | "mockup" | "video";

export type Project = {
  id: string;
  type: ProjectType;
  title: string;
  createdAt: number;
  data: unknown;
};

export function listProjects(): Project[] {
  return read<Project[]>("projects", []);
}

export function saveProject(type: ProjectType, title: string, data: unknown): Project | null {
  const project: Project = { id: crypto.randomUUID(), type, title, createdAt: Date.now(), data };
  const all = [project, ...listProjects()].slice(0, 50);
  // Si le stockage est plein, on supprime les plus anciens projets.
  for (let n = all.length; n > 0; n--) {
    if (write("projects", all.slice(0, n))) return project;
  }
  return null;
}

export function updateProject(id: string, data: unknown) {
  write(
    "projects",
    listProjects().map((p) => (p.id === id ? { ...p, data } : p)),
  );
}

export function deleteProject(id: string) {
  write(
    "projects",
    listProjects().filter((p) => p.id !== id),
  );
}

/* ---------- Appels API ---------- */

export async function api<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method: body === undefined ? "GET" : "POST",
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
      return await api<T>(path, body);
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
