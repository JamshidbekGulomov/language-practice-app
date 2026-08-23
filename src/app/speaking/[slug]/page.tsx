import Link from "next/link";
import { notFound } from "next/navigation";
import { getTopicBySlug, getQuestions, getHints, getMySubmission } from "@/lib/speaking/queries";
import { getCurrentProfile } from "@/lib/supabase/get-profile";
import { AudioRecorder } from "@/components/speaking/audio-recorder";
import { SubmissionPanel } from "@/components/speaking/submission-panel";
import { markSelfChecked, sendToTeacher } from "@/app/speaking/actions";

export default async function SpeakingTopicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const topic = await getTopicBySlug(slug);
  if (!topic) notFound();

  const [profile, questions, hints, submission] = await Promise.all([
    getCurrentProfile(),
    getQuestions(topic.id),
    getHints(topic.id),
    getMySubmission(topic.id),
  ]);

  const boundMarkSelfChecked = markSelfChecked.bind(null, slug);
  const boundSendToTeacher = sendToTeacher.bind(null, slug);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{topic.title}</h1>
      <p className="mt-3 text-slate-700">{topic.prompt}</p>

      {questions.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
            Guided questions
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
            {questions.map((q) => (
              <li key={q.id}>{q.question}</li>
            ))}
          </ul>
        </div>
      )}

      {hints.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
            Try to use these words
          </h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {hints.map((h) => (
              <span
                key={h.id}
                title={h.meaning ?? undefined}
                className="rounded-full bg-rose-50 px-3 py-1 text-sm font-medium text-rose-700"
              >
                {h.word}
              </span>
            ))}
          </div>
        </div>
      )}

      {!profile && (
        <p className="mt-8 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <Link href="/login" className="font-semibold underline">
            Log in
          </Link>{" "}
          to record your answer.
        </p>
      )}

      {profile && (
        <div className="mt-10">
          <h2 className="text-lg font-bold text-slate-900">Record your answer</h2>
          <div className="mt-4">
            {submission ? (
              <SubmissionPanel
                submission={submission}
                onMarkSelfChecked={boundMarkSelfChecked}
                onSendToTeacher={boundSendToTeacher}
              />
            ) : (
              <AudioRecorder topicId={topic.id} topicSlug={slug} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
