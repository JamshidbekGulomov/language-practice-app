import Link from "next/link";
import { MODULES } from "@/lib/modules";
import { SPEAKING_EXAMS, type SpeakingExam } from "@/lib/speaking/exams";

export default function SpeakingPage() {
  const mod = MODULES.find((m) => m.slug === "speaking")!;
  const Icon = mod.icon;

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <div
          className={`mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${mod.gradient} text-white`}
        >
          <Icon className="h-7 w-7" />
        </div>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900">Speaking</h1>
        <p className="mt-2 text-slate-500">Choose which exam you&apos;re preparing for.</p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {(Object.keys(SPEAKING_EXAMS) as SpeakingExam[]).map((examKey) => (
          <Link
            key={examKey}
            href={`/speaking/${examKey}`}
            className="rounded-xl border border-slate-200 bg-white p-8 text-center transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <h2 className="text-xl font-extrabold text-slate-900">{SPEAKING_EXAMS[examKey].label}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {SPEAKING_EXAMS[examKey].parts.length} parts
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
