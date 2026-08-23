import { notFound, redirect } from "next/navigation";
import { getPassageBySlug, getWordsForPassage } from "@/lib/reading/queries";
import { getCurrentProfile } from "@/lib/supabase/get-profile";
import { buildMultipleChoiceQuestions } from "@/lib/build-mc-questions";
import { MultipleChoiceGame } from "@/components/multiple-choice-game";
import { submitScore } from "@/app/reading/actions";

export default async function ReadingMultipleChoicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const passage = await getPassageBySlug(slug);
  if (!passage) notFound();

  const words = await getWordsForPassage(passage.id);
  const questions = buildMultipleChoiceQuestions(words);
  const boundSubmit = submitScore.bind(null, passage.id, slug, "multiple_choice");

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="mb-8 text-center text-2xl font-extrabold tracking-tight text-slate-900">
        {passage.title} — Multiple choice
      </h1>
      <MultipleChoiceGame
        questions={questions}
        backHref={`/reading/${slug}`}
        onSubmitScore={boundSubmit}
      />
    </div>
  );
}
