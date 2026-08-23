import Link from "next/link";
import { notFound } from "next/navigation";
import { isExam } from "@/lib/exam";
import { SPEAKING_EXAMS } from "@/lib/speaking/exams";
import { listTests } from "@/lib/reading-exam/queries";
import { MODULES } from "@/lib/modules";

export default async function ExamReadingPage({
  params,
}: {
  params: Promise<{ exam: string }>;
}) {
  const { exam } = await params;
  if (!isExam(exam)) notFound();

  const mod = MODULES.find((m) => m.slug === "reading")!;
  const Icon = mod.icon;
  const label = SPEAKING_EXAMS[exam].label;
  const tests = await listTests(exam);

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <div
          className={`mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${mod.gradient} text-white`}
        >
          <Icon className="h-7 w-7" />
        </div>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900">
          {label} Reading
        </h1>
        <p className="mt-2 text-slate-500">Pick a test to practice a passage, or take the full exam.</p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {tests.length === 0 ? (
          <p className="col-span-full text-center text-sm text-slate-400">
            No reading tests yet — check back soon.
          </p>
        ) : (
          tests.map((test) => (
            <Link
              key={test.id}
              href={`/reading-exam/${test.slug}`}
              className="rounded-xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <h2 className="font-bold text-slate-900">{test.title}</h2>
              <p className="mt-1 text-sm text-slate-500">3 passages + full exam</p>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
