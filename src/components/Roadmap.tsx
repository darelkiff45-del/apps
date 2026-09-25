import { ROADMAP } from "@/lib/roadmap";

const TONES = ["bg-green-100 text-green-700", "bg-brand-100 text-brand-700", "bg-gray-100 text-gray-600"];

export function Roadmap() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {ROADMAP.map((v, i) => (
        <div key={v.version} className={`card flex flex-col ${i === 0 ? "ring-2 ring-brand-500" : ""}`}>
          <div className="flex items-center justify-between">
            <span className="text-3xl font-black text-brand-600">{v.version}</span>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${TONES[i]}`}>{v.status}</span>
          </div>
          <h3 className="mt-2 text-lg font-extrabold">{v.name}</h3>
          <p className="mt-1 text-sm text-gray-500">{v.goal}</p>
          <ul className="mt-4 space-y-2 text-sm">
            {v.features.map((f) => (
              <li key={f} className="flex gap-2">
                <span className="text-brand-600">✓</span>
                {f}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
