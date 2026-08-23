import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getClipBySlug,
  getWordsForClip,
  getListeningLeaderboard,
} from "@/lib/listening/queries";
import { getCurrentProfile } from "@/lib/supabase/get-profile";
import { getAudioPublicUrl } from "@/lib/listening/storage";
import { Leaderboard } from "@/components/leaderboard";

export default async function ListeningClipPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const clip = await getClipBySlug(slug);
  if (!clip) notFound();

  const [words, profile, mcRows, fillRows, matchRows] = await Promise.all([
    getWordsForClip(clip.id),
    getCurrentProfile(),
    getListeningLeaderboard(clip.id, "multiple_choice"),
    getListeningLeaderboard(clip.id, "fill_blank"),
    getListeningLeaderboard(clip.id, "matching"),
  ]);

  const withMeaning = words.filter((w) => w.meaning).length;
  const canMultipleChoice = withMeaning >= 4;
  const canMatch = withMeaning >= 2;
  const canFillBlank = !!clip.transcript && words.length > 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{clip.title}</h1>
      <p className="mt-1 text-slate-500">
        {words.length} word{words.length === 1 ? "" : "s"}
      </p>

      <audio controls src={getAudioPublicUrl(clip.audio_path)} className="mt-6 w-full" />

      {clip.transcript && (
        <details className="mt-4 rounded-lg border border-slate-200 p-4">
          <summary className="cursor-pointer text-sm font-medium text-slate-700">
            Show transcript
          </summary>
          <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">{clip.transcript}</p>
        </details>
      )}

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
          href={canMultipleChoice ? `/listening/${slug}/multiple-choice` : "#"}
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
          href={canFillBlank ? `/listening/${slug}/fill-blank` : "#"}
          aria-disabled={!canFillBlank}
          className={`rounded-xl border border-slate-200 bg-white p-5 text-center transition ${
            canFillBlank ? "hover:-translate-y-0.5 hover:shadow-md" : "pointer-events-none opacity-50"
          }`}
        >
          <p className="font-bold text-slate-900">Fill in the blank</p>
          <p className="mt-1 text-xs text-slate-500">Complete the transcript</p>
          {!canFillBlank && (
            <p className="mt-1 text-[10px] text-slate-400">Needs a transcript</p>
          )}
        </Link>

        <Link
          href={canMatch ? `/listening/${slug}/matching` : "#"}
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
