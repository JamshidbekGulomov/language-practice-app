import Link from "next/link";
import { TRACKS } from "@/lib/tracks";

export default function Home() {
  return (
    <div className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 flex justify-center overflow-hidden"
      >
        <div className="h-[420px] w-[720px] rounded-full bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-amber-300 opacity-20 blur-3xl" />
      </div>

      <section className="text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          Practice a little,{" "}
          <span className="bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-amber-500 bg-clip-text text-transparent">
            every day
          </span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-slate-500">
          Pick your track to get started.
        </p>
      </section>

      <section className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-3">
        {TRACKS.map((t) => {
          const Icon = t.icon;
          return (
            <Link
              key={t.slug}
              href={t.href}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div
                className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${t.gradient} text-white shadow-sm`}
              >
                <Icon className="h-6 w-6" />
              </div>
              <h2 className="mt-4 text-xl font-bold text-slate-900">{t.name}</h2>
              <p className="mt-1 text-sm text-slate-500">{t.tagline}</p>
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
