import Link from "next/link";
import { notFound } from "next/navigation";
import { getTestBySlug, getPassagesForTest } from "@/lib/reading-exam/queries";
import { EXAM_LABELS } from "@/lib/exam";

export default async function ReadingExamTestPage({
  params,
}: {
  params: Promise<{ testSlug: string }>;
}) {
  const { testSlug } = await params;
  const test = await getTestBySlug(testSlug);
  if (!test) notFound();

  const passages = await getPassagesForTest(test.id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{test.title}</h1>
        <p className="mt-2 text-slate-500">{EXAM_LABELS[test.exam]} Reading &middot; practice a single passage, or take the full exam.</p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {passages.map((p) => (
          <Link
            key={p.id}
            href={`/reading-exam/${testSlug}/passage/${p.passage_number}`}
            className="rounded-xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <h2 className="font-bold text-slate-900">Passage {p.passage_number}</h2>
            <p className="mt-1 text-sm text-slate-500">{p.title}</p>
          </Link>
        ))}

        <Link
          href={`/reading-exam/${testSlug}/full`}
          className="rounded-xl border-2 border-red-200 bg-red-50 p-5 transition hover:-translate-y-0.5 hover:shadow-md sm:col-span-2"
        >
          <h2 className="font-bold text-red-700">🎯 Full Exam</h2>
          <p className="mt-1 text-sm text-red-500">All three passages, one continuous 60-minute test.</p>
        </Link>
      </div>
    </div>
  );
}
