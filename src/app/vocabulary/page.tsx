import Link from "next/link";
import { listCategories } from "@/lib/vocabulary/queries";
import { MODULES } from "@/lib/modules";

export default async function VocabularyPage() {
  const mod = MODULES.find((m) => m.slug === "vocabulary")!;
  const Icon = mod.icon;
  const categories = await listCategories();

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <div
          className={`mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${mod.gradient} text-white`}
        >
          <Icon className="h-7 w-7" />
        </div>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900">
          Vocabulary
        </h1>
        <p className="mt-2 text-slate-500">Pick a category to start practicing.</p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {categories.length === 0 ? (
          <p className="col-span-full text-center text-sm text-slate-400">
            No categories yet — check back soon.
          </p>
        ) : (
          categories.map((c) => (
            <Link
              key={c.id}
              href={`/vocabulary/${c.slug}`}
              className="rounded-xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <h2 className="font-bold text-slate-900">{c.name}</h2>
              <p className="mt-1 text-sm text-slate-500">
                {c.wordCount} word{c.wordCount === 1 ? "" : "s"}
              </p>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
