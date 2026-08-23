import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getLessonBySlug,
  getGapFillExercises,
  getSentencePrompts,
  hasCompletedGapFill,
  getMySubmissions,
} from "@/lib/writing/queries";
import { getCurrentProfile } from "@/lib/supabase/get-profile";
import { getVideoEmbed } from "@/lib/writing/video-embed";
import { GapFillExercises } from "@/components/writing/gap-fill-exercises";
import { SentenceExercises } from "@/components/writing/sentence-exercises";
import { TelegramEmbed } from "@/components/writing/telegram-embed";
import { VideoContainer } from "@/components/writing/video-container";
import { submitGapFillResult, submitSentence, markSelfChecked, sendToTeacher } from "@/app/writing/actions";

export default async function WritingLessonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const lesson = await getLessonBySlug(slug);
  if (!lesson) notFound();

  const [profile, gapFillExercises, sentencePrompts, unlocked, submissionsMap] =
    await Promise.all([
      getCurrentProfile(),
      getGapFillExercises(lesson.id),
      getSentencePrompts(lesson.id),
      hasCompletedGapFill(lesson.id),
      getMySubmissions(lesson.id),
    ]);

  const embed = getVideoEmbed(lesson.video_url);
  const submissions = Object.fromEntries(submissionsMap);

  const boundSubmitScore = submitGapFillResult.bind(null, lesson.id, slug);
  const boundSubmitSentence = submitSentence.bind(null, lesson.id, slug);
  const boundMarkSelfChecked = markSelfChecked.bind(null, slug);
  const boundSendToTeacher = sendToTeacher.bind(null, slug);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{lesson.title}</h1>
      {lesson.description && <p className="mt-1 text-slate-500">{lesson.description}</p>}

      {embed?.kind === "youtube" && (
        <div className="mt-6">
          <VideoContainer>
            <div className="aspect-video w-full">
              <iframe
                src={embed.embedUrl}
                title={lesson.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
          </VideoContainer>
        </div>
      )}
      {embed?.kind === "telegram" && (
        <div className="mt-6">
          <VideoContainer>
            <div className="p-2">
              <TelegramEmbed postPath={embed.postPath} />
            </div>
          </VideoContainer>
        </div>
      )}
      {!embed && <p className="mt-6 text-sm text-red-600">Couldn&apos;t load this video link.</p>}

      {!profile && (
        <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <Link href="/login" className="font-semibold underline">
            Log in
          </Link>{" "}
          to do the exercises and save your progress.
        </p>
      )}

      {profile && (
        <>
          <div className="mt-10">
            <h2 className="text-lg font-bold text-slate-900">1. Gap-fill</h2>
            <p className="mt-1 text-sm text-slate-500">
              Complete these to unlock the sentence-writing exercises.
            </p>
            <div className="mt-4">
              <GapFillExercises exercises={gapFillExercises} onSubmitScore={boundSubmitScore} />
            </div>
          </div>

          <div className="mt-10">
            <h2 className="text-lg font-bold text-slate-900">2. Write your own sentence</h2>
            {unlocked ? (
              <div className="mt-4">
                <SentenceExercises
                  prompts={sentencePrompts}
                  submissions={submissions}
                  onSubmit={boundSubmitSentence}
                  onMarkSelfChecked={boundMarkSelfChecked}
                  onSendToTeacher={boundSendToTeacher}
                />
              </div>
            ) : (
              <p className="mt-4 rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
                Complete the gap-fill exercises above first.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
