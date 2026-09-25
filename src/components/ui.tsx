"use client";

export function PageHeader({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <header className="mb-6">
      <h1 className="flex items-center gap-3 text-2xl font-extrabold md:text-3xl">
        <span>{icon}</span>
        {title}
      </h1>
      <p className="mt-1 text-gray-500">{desc}</p>
    </header>
  );
}

export function ErrorBox({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {error}
      {/crédit|formule/i.test(error) && (
        <a href="/tarifs" className="mt-2 block font-semibold text-brand-700 underline">
          Voir les formules →
        </a>
      )}
      {/connecte-toi/i.test(error) && (
        <a href="/connexion" className="mt-2 block font-semibold text-brand-700 underline">
          Se connecter →
        </a>
      )}
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      {label}
    </span>
  );
}

export function GenerateButton({
  loading,
  onClick,
  children,
  loadingLabel = "L'IA travaille… (jusqu'à 2 min)",
  disabled,
}: {
  loading: boolean;
  onClick: () => void;
  children: React.ReactNode;
  loadingLabel?: string;
  disabled?: boolean;
}) {
  return (
    <button className="btn-primary w-full" disabled={loading || disabled} onClick={onClick}>
      {loading ? <Spinner label={loadingLabel} /> : children}
    </button>
  );
}

export function EmptyState({ text }: { text: string }) {
  return (
    <div className="grid min-h-[400px] place-items-center rounded-2xl border-2 border-dashed border-gray-200 bg-white/50 p-8 text-center text-gray-400">
      {text}
    </div>
  );
}
