import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getPassageBySlug,
  getWordsForPassage,
  getReadingLeaderboard,
} from "@/lib/reading/queries";
import { getCurrentProfile } from "@/lib/supabase/get-profile";
import { Leaderboard } from "@/components/leaderboard";

export default async function ReadingPassagePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const passage = await getPassageBySlug(slug);
  if (!passage) notFound();

  const [words, profile, mcRows, fillRows, matchRows] = await Promise.all([
    getWordsForPassage(passage.id),
    getCurrentProfile(),
    getReadingLeaderboard(passage.id, "multiple_choice"),
    getReadingLeaderboard(passage.id, "fill_blank"),
    getReadingLeaderboard(passage.id, "matching"),
  ]);

  const withMeaning = words.filter((w) => w.meaning).length;
  const canMultipleChoice = withMeaning >= 4;
  const canMatch = withMeaning >= 2;
  const canFillBlank = words.length > 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{passage.title}</h1>
      <p className="mt-1 text-slate-500">
        {words.length} word{words.length === 1 ? "" : "s"}
      </p>

      <div className="mt-6 rounded-lg border border-slate-200 p-4">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
          {passage.body}
        </p>
      </div>

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
          href={canMultipleChoice ? `/reading/${slug}/multiple-choice` : "#"}
          aria-disabled={!canMultipleChoice}
          className={`rounded-xl border border-slate-200 bg-white p-5 text-center transition ${
            canMultipleChoice
              ? "hover:-translate-y-0.5 hover:shadow-md"
              : "pointer-events-none opacity-50"
          }`}
        >
          <p className="font-bold text-slate-900">Multiple choice</p>
          <p className="mt-1 text-xs text-slate-500">Pick the right meaning</p>
          {!canMultipleChoice && (
            <p className="mt-1 text-[10px] text-slate-400">Needs 4+ words with meanings</p>
          )}
        </Link>

        <Link
          href={canFillBlank ? `/reading/${slug}/fill-blank` : "#"}
          aria-disabled={!canFillBlank}
          className={`rounded-xl border border-slate-200 bg-white p-5 text-center transition ${
            canFillBlank ? "hover:-translate-y-0.5 hover:shadow-md" : "pointer-events-none opacity-50"
          }`}
        >
          <p className="font-bold text-slate-900">Fill in the blank</p>
          <p className="mt-1 text-xs text-slate-500">Complete the passage</p>
          {!canFillBlank && <p className="mt-1 text-[10px] text-slate-400">Needs vocab words</p>}
        </Link>

        <Link
          href={canMatch ? `/reading/${slug}/matching` : "#"}
          aria-disabled={!canMatch}
          className={`rounded-xl border border-slate-200 bg-white p-5 text-center transition ${
            canMatch ? "hover:-translate-y-0.5 hover:shadow-md" : "pointer-events-none opacity-50"
          }`}
        >
          <p className="font-bold text-slate-900">Word matching</p>
          <p className="mt-1 text-xs text-slate-500">Word ↔ meaning</p>
          {!canMatch && <p className="mt-1 text-[10px] text-slate-400">Needs 2+ words with meanings</p>}
        </Link>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3">
        <Leaderboard rows={mcRows} title="Multiple choice leaderboard" />
        <Leaderboard rows={fillRows} title="Fill-in-the-blank leaderboard" />
        <Leaderboard rows={matchRows} title="Matching leaderboard" />
      </div>
    </div>
  );
}
