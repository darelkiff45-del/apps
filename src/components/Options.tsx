"use client";

/** Options communes : nombre de variantes et images IA, avec le coût affiché. */
export function VariantToggle({ value, onChange }: { value: 1 | 3; onChange: (v: 1 | 3) => void }) {
  return (
    <div>
      <label className="label">Versions à générer</label>
      <div className="grid grid-cols-2 rounded-lg bg-gray-100 p-1 text-xs font-semibold">
        {([1, 3] as const).map((n) => (
          <button key={n} onClick={() => onChange(n)} className={`rounded-md py-1.5 ${value === n ? "bg-white shadow" : "text-gray-500"}`}>
            {n === 1 ? "1 version" : "3 versions (A/B/C)"}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg bg-gray-50 p-3">
      <input type="checkbox" className="mt-0.5 h-4 w-4 accent-brand-600" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        {hint && <span className="block text-xs text-gray-500">{hint}</span>}
      </span>
    </label>
  );
}
