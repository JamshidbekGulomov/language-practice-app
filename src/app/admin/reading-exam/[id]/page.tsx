import Link from "next/link";
import { notFound } from "next/navigation";
import { adminList } from "@/lib/admin/crud";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { EXAM_LABELS } from "@/lib/exam";
import type { ReadingExamTest, ReadingExamPassage } from "@/lib/reading-exam/types";

export default async function AdminReadingExamTestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const tests = await adminList<ReadingExamTest>("reading_exam_tests", { eq: { id } });
  const test = tests[0];
  if (!test) notFound();

  const passages = await adminList<ReadingExamPassage>("reading_exam_passages", {
    eq: { test_id: id },
    orderBy: "passage_number",
    ascending: true,
  });

  return (
    <div>
      <AdminPageHeader title={test.title} description={`${EXAM_LABELS[test.exam]} · Reading Exam`} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {passages.map((p) => {
          const groupCount = p.question_groups.length;
          const questionCount = p.question_groups.reduce((sum, g) => {
            if (g.type === "summary_completion") return sum + g.answers.length;
            return sum + g.items.length;
          }, 0);
          return (
            <Link
              key={p.id}
              href={`/admin/reading-exam/${test.id}/passage/${p.passage_number}`}
              className="rounded-xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <h2 className="font-bold text-slate-900">Passage {p.passage_number}</h2>
              <p className="mt-1 text-sm text-slate-500">{p.title}</p>
              <p className="mt-2 text-xs text-slate-400">
                {p.paragraphs.length} paragraph{p.paragraphs.length === 1 ? "" : "s"} · {groupCount} question
                group{groupCount === 1 ? "" : "s"} · {questionCount} question{questionCount === 1 ? "" : "s"}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
