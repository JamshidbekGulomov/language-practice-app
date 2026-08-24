import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, FileText, BookOpen } from "lucide-react";
import { isExam } from "@/lib/exam";
import { SPEAKING_EXAMS } from "@/lib/speaking/exams";
import { listTestsWithStats } from "@/lib/reading-exam/queries";
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
  const tests = await listTestsWithStats(exam);

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

      <div className="mt-10 space-y-4">
        {tests.length === 0 ? (
          <p className="text-center text-sm text-slate-400">No reading tests yet — check back soon.</p>
        ) : (
          tests.map((test) => (
            <Link
              key={test.id}
              href={`/reading-exam/${test.slug}`}
              className="block rounded-xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <h2 className="font-bold text-slate-900">{test.title}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-4 w-4" /> 60 min
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <FileText className="h-4 w-4" /> {test.questionCount} questions
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4" /> {test.passageCount} passages
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
