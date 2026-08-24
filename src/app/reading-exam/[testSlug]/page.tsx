import Link from "next/link";
import { notFound } from "next/navigation";
import { Play, Clock, FileText, BookOpen } from "lucide-react";
import { getTestBySlug, getPassagesForTest } from "@/lib/reading-exam/queries";
import { questionsInGroup } from "@/lib/reading-exam/types";
import { EXAM_LABELS } from "@/lib/exam";
import { PracticeSinglePassages } from "@/components/reading-exam/practice-single-passages";

export default async function ReadingExamTestPage({
  params,
}: {
  params: Promise<{ testSlug: string }>;
}) {
  const { testSlug } = await params;
  const test = await getTestBySlug(testSlug);
  if (!test) notFound();

  const passages = await getPassagesForTest(test.id);
  const passageStats = passages.map((p) => ({
    passage_number: p.passage_number,
    title: p.title,
    questionCount: p.question_groups.reduce((sum, g) => sum + questionsInGroup(g).length, 0),
  }));
  const totalQuestions = passageStats.reduce((sum, p) => sum + p.questionCount, 0);

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <p className="text-sm font-semibold text-emerald-600">{EXAM_LABELS[test.exam]} Reading</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">{test.title}</h1>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-4 w-4" /> 60 min
          </span>
          <span className="inline-flex items-center gap-1.5">
            <FileText className="h-4 w-4" /> {totalQuestions} questions
          </span>
          <span className="inline-flex items-center gap-1.5">
            <BookOpen className="h-4 w-4" /> {passages.length} passages
          </span>
        </div>

        <Link
          href={`/reading-exam/${testSlug}/full`}
          className="mt-5 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 py-3 text-sm font-bold text-white shadow-sm transition hover:from-amber-400 hover:to-orange-500"
        >
          <Play className="h-4 w-4 fill-current" /> Start Full Exam (60 min)
        </Link>

        <PracticeSinglePassages testSlug={testSlug} passages={passageStats} />
      </div>
    </div>
  );
}
