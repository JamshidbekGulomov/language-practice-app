import { notFound, redirect } from "next/navigation";
import { getClipBySlug, getWordsForClip } from "@/lib/listening/queries";
import { getCurrentProfile } from "@/lib/supabase/get-profile";
import { buildMultipleChoiceQuestions } from "@/lib/listening/build-mc-questions";
import { MultipleChoiceGame } from "@/components/listening/multiple-choice-game";
import { submitScore } from "@/app/listening/actions";

export default async function ListeningMultipleChoicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const clip = await getClipBySlug(slug);
  if (!clip) notFound();

  const words = await getWordsForClip(clip.id);
  const questions = buildMultipleChoiceQuestions(words);
  const boundSubmit = submitScore.bind(null, clip.id, slug, "multiple_choice");

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="mb-8 text-center text-2xl font-extrabold tracking-tight text-slate-900">
        {clip.title} — Multiple choice
      </h1>
      <MultipleChoiceGame
        questions={questions}
        backHref={`/listening/${slug}`}
        onSubmitScore={boundSubmit}
      />
    </div>
  );
}
