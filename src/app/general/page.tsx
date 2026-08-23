import Link from "next/link";
import { MODULES } from "@/lib/modules";

const GENERAL_SLUGS = ["listening", "reading", "vocabulary", "writing", "translation"];

export default function GeneralEnglishPage() {
  const modules = MODULES.filter((m) => GENERAL_SLUGS.includes(m.slug));

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <section className="text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
          General English
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-slate-500">
          Five skills, one place. Pick a module below to get started.
        </p>
      </section>

      <section className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((m) => {
          const Icon = m.icon;
          return (
            <Link
              key={m.slug}
              href={`/${m.slug}`}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div
                className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${m.gradient} text-white shadow-sm`}
              >
                <Icon className="h-6 w-6" />
              </div>
              <h2 className="mt-4 text-xl font-bold text-slate-900">{m.name}</h2>
              <p className="mt-1 text-sm text-slate-500">{m.tagline}</p>
              <span className="mt-4 inline-block text-sm font-semibold text-slate-400 transition group-hover:text-indigo-600">
                Explore &rarr;
              </span>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
