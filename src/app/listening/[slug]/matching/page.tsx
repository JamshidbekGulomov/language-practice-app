import { notFound, redirect } from "next/navigation";
import { getClipBySlug, getWordsForClip } from "@/lib/listening/queries";
import { getCurrentProfile } from "@/lib/supabase/get-profile";
import { sample } from "@/lib/vocabulary/sample";
import { getAudioPublicUrl } from "@/lib/listening/storage";
import { MatchingGame } from "@/components/matching-game";
import { submitScore } from "@/app/listening/actions";

const ROUND_SIZE = 8;

export default async function ListeningMatchingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const clip = await getClipBySlug(slug);
  if (!clip) notFound();

  const words = (await getWordsForClip(clip.id)).filter((w) => w.meaning);
  if (words.length < 2) {
    return (
      <p className="mx-auto max-w-md px-4 py-16 text-center text-slate-500">
        Not enough vocab yet for this game.
      </p>
    );
  }

  const round = sample(words, Math.min(ROUND_SIZE, words.length));
  const pairs = round.map((w) => ({ id: w.id, left: w.word, right: w.meaning! }));
  const boundSubmit = submitScore.bind(null, clip.id, slug, "matching");

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="mb-4 text-center text-2xl font-extrabold tracking-tight text-slate-900">
        {clip.title} — Matching
      </h1>
      <audio controls src={getAudioPublicUrl(clip.audio_path)} className="mx-auto mb-8 w-full max-w-md" />
      <MatchingGame
        pairs={pairs}
        backHref={`/listening/${slug}`}
        backLabel="Back to clip"
        onSubmitScore={boundSubmit}
      />
    </div>
  );
}
