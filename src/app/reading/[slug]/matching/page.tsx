import { notFound, redirect } from "next/navigation";
import { getPassageBySlug, getWordsForPassage } from "@/lib/reading/queries";
import { getCurrentProfile } from "@/lib/supabase/get-profile";
import { sample, MATCHING_ROUND_SIZE } from "@/lib/sample";
import { MatchingGame } from "@/components/matching-game";
import { submitScore } from "@/app/reading/actions";

export default async function ReadingMatchingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const passage = await getPassageBySlug(slug);
  if (!passage) notFound();

  const words = (await getWordsForPassage(passage.id)).filter((w) => w.meaning);
  if (words.length < 2) {
    return (
      <p className="mx-auto max-w-md px-4 py-16 text-center text-slate-500">
        Not enough vocab yet for this game.
      </p>
    );
  }

  const round = sample(words, Math.min(MATCHING_ROUND_SIZE, words.length));
  const pairs = round.map((w) => ({ id: w.id, left: w.word, right: w.meaning! }));
  const boundSubmit = submitScore.bind(null, passage.id, slug, "matching");

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="mb-8 text-center text-2xl font-extrabold tracking-tight text-slate-900">
        {passage.title} — Matching
      </h1>
      <MatchingGame
        pairs={pairs}
        backHref={`/reading/${slug}`}
        backLabel="Back to passage"
        onSubmitScore={boundSubmit}
      />
    </div>
  );
}
