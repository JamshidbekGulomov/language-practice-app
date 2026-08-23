import Link from "next/link";
import { listLevels } from "@/lib/translation/queries";
import { MODULES } from "@/lib/modules";

export default async function TranslationPage() {
  const mod = MODULES.find((m) => m.slug === "translation")!;
  const Icon = mod.icon;
  const levels = await listLevels();

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <div
          className={`mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${mod.gradient} text-white`}
        >
          <Icon className="h-7 w-7" />
        </div>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900">Translation</h1>
        <p className="mt-2 text-slate-500">Pick a level to start practicing.</p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {levels.length === 0 ? (
          <p className="col-span-full text-center text-sm text-slate-400">
            No levels yet — check back soon.
          </p>
        ) : (
          levels.map((l) => (
            <Link
              key={l.id}
              href={`/translation/${l.slug}`}
              className="rounded-xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <h2 className="font-bold text-slate-900">{l.title}</h2>
              {l.description && (
                <p className="mt-1 line-clamp-2 text-sm text-slate-500">{l.description}</p>
              )}
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
