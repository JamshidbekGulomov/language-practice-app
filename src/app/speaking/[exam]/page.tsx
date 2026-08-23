import Link from "next/link";
import { notFound } from "next/navigation";
import { listTopicsByExam } from "@/lib/speaking/queries";
import { SPEAKING_EXAMS, isSpeakingExam } from "@/lib/speaking/exams";

export default async function SpeakingExamPage({
  params,
}: {
  params: Promise<{ exam: string }>;
}) {
  const { exam } = await params;
  if (!isSpeakingExam(exam)) notFound();

  const examDef = SPEAKING_EXAMS[exam];
  const topics = await listTopicsByExam(exam);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{examDef.label}</h1>
      <p className="mt-2 text-slate-500">Pick a part, then a topic to practice.</p>

      <div className="mt-10 space-y-8">
        {examDef.parts.map((part) => {
          const partTopics = topics.filter((t) => t.part === part.key);
          return (
            <div key={part.key}>
              <h2 className="text-lg font-bold text-slate-900">{part.label}</h2>
              <p className="text-sm text-slate-500">{part.description}</p>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {partTopics.length === 0 ? (
                  <p className="col-span-full rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-400">
                    No topics yet — check back soon.
                  </p>
                ) : (
                  partTopics.map((t) => (
                    <Link
                      key={t.id}
                      href={`/speaking/${exam}/${t.slug}`}
                      className="rounded-xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <h3 className="font-bold text-slate-900">{t.title}</h3>
                      <p className="mt-1 line-clamp-2 text-sm text-slate-500">{t.prompt}</p>
                    </Link>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
