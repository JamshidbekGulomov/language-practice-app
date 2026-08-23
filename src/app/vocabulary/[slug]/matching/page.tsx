import { notFound, redirect } from "next/navigation";
import { getCategoryBySlug, getWordsForCategory } from "@/lib/vocabulary/queries";
import { getCurrentProfile } from "@/lib/supabase/get-profile";
import { sample, MATCHING_ROUND_SIZE } from "@/lib/vocabulary/sample";
import { MatchingGame } from "@/components/vocabulary/matching-game";
import { submitScore } from "@/app/vocabulary/actions";

export default async function VocabMatchingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const words = await getWordsForCategory(category.id);
  if (words.length < 2) {
    return (
      <p className="mx-auto max-w-md px-4 py-16 text-center text-slate-500">
        Not enough words yet for this game.
      </p>
    );
  }

  const round = sample(words, Math.min(MATCHING_ROUND_SIZE, words.length));
  const pairs = round.map((w) => ({ id: w.id, left: w.english, right: w.uzbek }));
  const boundSubmit = submitScore.bind(null, category.id, slug, "matching");

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="mb-8 text-center text-2xl font-extrabold tracking-tight text-slate-900">
        {category.name} — Matching
      </h1>
      <MatchingGame pairs={pairs} categorySlug={slug} onSubmitScore={boundSubmit} />
    </div>
  );
}
