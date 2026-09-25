"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { createClient } from "@/lib/supabase/browser";

function ConnexionForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/studio";
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    params.get("erreur") ? { ok: false, text: "Lien de connexion invalide ou expiré." } : null,
  );

  const redirectTo = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const supabase = createClient();
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage({ ok: false, text: "Email ou mot de passe incorrect." });
      else {
        router.push(next);
        router.refresh();
      }
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name }, emailRedirectTo: redirectTo() },
      });
      if (error) setMessage({ ok: false, text: error.message });
      else if (data.session) {
        router.push(next);
        router.refresh();
      } else setMessage({ ok: true, text: "Compte créé ! Clique sur le lien reçu par email pour l'activer." });
    }
    setLoading(false);
  };

  const google = async () => {
    await createClient().auth.signInWithOAuth({ provider: "google", options: { redirectTo: redirectTo() } });
  };

  const magicLink = async () => {
    if (!email) return setMessage({ ok: false, text: "Indique ton email d'abord." });
    const { error } = await createClient().auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo() } });
    setMessage(error ? { ok: false, text: error.message } : { ok: true, text: "Lien de connexion envoyé par email." });
  };

  return (
    <div className="card w-full max-w-md p-8">
      <Link href="/" className="mb-6 flex items-center justify-center gap-2 text-lg font-extrabold">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">✦</span>
        Créateur Digital
      </Link>
      <div className="mb-6 grid grid-cols-2 rounded-lg bg-gray-100 p-1 text-sm font-semibold">
        {(["login", "signup"] as const).map((m) => (
          <button key={m} onClick={() => setMode(m)} className={`rounded-md py-2 ${mode === m ? "bg-white shadow" : "text-gray-500"}`}>
            {m === "login" ? "Connexion" : "Créer un compte"}
          </button>
        ))}
      </div>
      <button className="btn-ghost w-full" onClick={google}>
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
          <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
          <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
        </svg>
        Continuer avec Google
      </button>
      <div className="my-5 flex items-center gap-3 text-xs text-gray-400">
        <div className="h-px flex-1 bg-gray-200" /> ou <div className="h-px flex-1 bg-gray-200" />
      </div>
      <form onSubmit={submit} className="space-y-3">
        {mode === "signup" && (
          <div>
            <label className="label">Nom</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
        )}
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="label">Mot de passe</label>
          <input className="input" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button className="btn-primary w-full" disabled={loading}>
          {loading ? "…" : mode === "login" ? "Se connecter" : "Créer mon compte (5 crédits offerts)"}
        </button>
      </form>
      {mode === "login" && (
        <button className="mt-3 w-full text-center text-xs text-gray-500 hover:text-brand-600" onClick={magicLink}>
          Mot de passe oublié ? Recevoir un lien de connexion par email
        </button>
      )}
      {message && (
        <p className={`mt-4 rounded-lg px-3 py-2 text-sm ${message.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{message.text}</p>
      )}
    </div>
  );
}

export default function ConnexionPage() {
  return (
    <div className="grid min-h-screen place-items-center p-4">
      <Suspense>
        <ConnexionForm />
      </Suspense>
    </div>
  );
}
