import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategoryBySlug, getWordsForCategory } from "@/lib/vocabulary/queries";
import { getCurrentProfile } from "@/lib/supabase/get-profile";
import { Leaderboard } from "@/components/vocabulary/leaderboard";

export default async function VocabCategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const [words, profile] = await Promise.all([
    getWordsForCategory(category.id),
    getCurrentProfile(),
  ]);

  const synonymCount = words.filter((w) => w.synonym).length;
  const canMatch = words.length >= 2;
  const canSynonym = synonymCount >= 2;

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{category.name}</h1>
      <p className="mt-1 text-slate-500">
        {words.length} word{words.length === 1 ? "" : "s"}
      </p>

      {!profile && (
        <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <Link href="/login" className="font-semibold underline">
            Log in
          </Link>{" "}
          to play and save your score.
        </p>
      )}

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          href={`/vocabulary/${slug}/flashcards`}
          className="rounded-xl border border-slate-200 bg-white p-5 text-center transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <p className="font-bold text-slate-900">Flashcards</p>
          <p className="mt-1 text-xs text-slate-500">Flip to reveal</p>
        </Link>

        <Link
          href={canMatch ? `/vocabulary/${slug}/matching` : "#"}
          aria-disabled={!canMatch}
          className={`rounded-xl border border-slate-200 bg-white p-5 text-center transition ${
            canMatch ? "hover:-translate-y-0.5 hover:shadow-md" : "pointer-events-none opacity-50"
          }`}
        >
          <p className="font-bold text-slate-900">Matching</p>
          <p className="mt-1 text-xs text-slate-500">English ↔ Uzbek</p>
        </Link>

        <Link
          href={canSynonym ? `/vocabulary/${slug}/synonym` : "#"}
          aria-disabled={!canSynonym}
          className={`rounded-xl border border-slate-200 bg-white p-5 text-center transition ${
            canSynonym ? "hover:-translate-y-0.5 hover:shadow-md" : "pointer-events-none opacity-50"
          }`}
        >
          <p className="font-bold text-slate-900">Synonym match</p>
          <p className="mt-1 text-xs text-slate-500">Harder mode</p>
          {!canSynonym && (
            <p className="mt-1 text-[10px] text-slate-400">Needs 2+ words with synonyms</p>
          )}
        </Link>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2">
        <Leaderboard categoryId={category.id} mode="matching" title="Matching leaderboard" />
        <Leaderboard categoryId={category.id} mode="synonym" title="Synonym match leaderboard" />
      </div>
    </div>
  );
}
