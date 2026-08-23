import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  getTopicBySlug,
  getQuestions,
  getHints,
  getImages,
  getMySubmission,
  getMyQuestionSubmissions,
} from "@/lib/speaking/queries";
import { getCurrentProfile } from "@/lib/supabase/get-profile";
import { getSpeakingImageUrl } from "@/lib/speaking/storage";
import { getPartDef, isSpeakingExam } from "@/lib/speaking/exams";
import { AudioRecorder } from "@/components/speaking/audio-recorder";
import { SubmissionPanel } from "@/components/speaking/submission-panel";
import { QaPractice } from "@/components/speaking/qa-practice";
import { markSelfChecked, sendToTeacher } from "@/app/speaking/actions";

export default async function SpeakingTopicPage({
  params,
}: {
  params: Promise<{ exam: string; slug: string }>;
}) {
  const { exam, slug } = await params;
  if (!isSpeakingExam(exam)) notFound();

  const topic = await getTopicBySlug(slug);
  if (!topic || topic.exam !== exam) notFound();

  const partDef = getPartDef(topic.exam, topic.part);
  const topicPath = `/speaking/${exam}/${slug}`;
  const isQa = topic.format === "qa";

  const [profile, questions, hints, images, submission, questionSubmissions] = await Promise.all([
    getCurrentProfile(),
    getQuestions(topic.id),
    getHints(topic.id),
    topic.format === "images" ? getImages(topic.id) : Promise.resolve([]),
    isQa ? Promise.resolve(null) : getMySubmission(topic.id),
    isQa ? getMyQuestionSubmissions(topic.id) : Promise.resolve(new Map()),
  ]);

  const boundMarkSelfChecked = markSelfChecked.bind(null, topicPath);
  const boundSendToTeacher = sendToTeacher.bind(null, topicPath);

  // For qa format, each question gets its own recorder inline below — the
  // plain list is only useful before login (or for other formats, where
  // it's optional guidance alongside a single take).
  const showQuestionList = questions.length > 0 && !(profile && isQa);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <Link href={`/speaking/${exam}`} className="text-sm font-medium text-sky-600 hover:underline">
        ← {partDef?.label ?? topic.part}
      </Link>

      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">{topic.title}</h1>
      <p className="mt-3 text-slate-700">{topic.prompt}</p>

      {topic.format === "images" && images.length > 0 && (
        <div className={`mt-6 grid gap-3 ${images.length > 1 ? "sm:grid-cols-2" : "grid-cols-1"}`}>
          {images.map((img) => (
            <div key={img.id} className="overflow-hidden rounded-xl border border-slate-200">
              <Image
                src={getSpeakingImageUrl(img.image_path)}
                alt=""
                width={600}
                height={450}
                className="h-auto w-full object-cover"
              />
            </div>
          ))}
        </div>
      )}

      {showQuestionList && (
        <div className="mt-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
            {isQa ? "Questions" : "Guided questions"}
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
            {isQa ? (
              <QaPractice
                topicId={topic.id}
                topicPath={topicPath}
                questions={questions}
                submissions={Object.fromEntries(questionSubmissions)}
                onMarkSelfChecked={boundMarkSelfChecked}
                onSendToTeacher={boundSendToTeacher}
              />
            ) : submission ? (
              <SubmissionPanel
                submission={submission}
                onMarkSelfChecked={boundMarkSelfChecked}
                onSendToTeacher={boundSendToTeacher}
              />
            ) : (
              <AudioRecorder
                topicId={topic.id}
                topicPath={topicPath}
                prepSeconds={partDef?.prepSeconds}
                maxSeconds={partDef?.maxSeconds}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
