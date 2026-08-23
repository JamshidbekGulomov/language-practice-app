import Link from "next/link";
import { listTopics } from "@/lib/speaking/queries";
import { MODULES } from "@/lib/modules";

export default async function SpeakingPage() {
  const mod = MODULES.find((m) => m.slug === "speaking")!;
  const Icon = mod.icon;
  const topics = await listTopics();

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <div
          className={`mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${mod.gradient} text-white`}
        >
          <Icon className="h-7 w-7" />
        </div>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900">Speaking</h1>
        <p className="mt-2 text-slate-500">Pick a topic to practice.</p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {topics.length === 0 ? (
          <p className="col-span-full text-center text-sm text-slate-400">
            No topics yet — check back soon.
          </p>
        ) : (
          topics.map((t) => (
            <Link
              key={t.id}
              href={`/speaking/${t.slug}`}
              className="rounded-xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <h2 className="font-bold text-slate-900">{t.title}</h2>
              <p className="mt-1 line-clamp-2 text-sm text-slate-500">{t.prompt}</p>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
