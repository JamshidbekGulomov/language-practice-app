import { notFound, redirect } from "next/navigation";
import { getClipBySlug, getWordsForClip } from "@/lib/listening/queries";
import { getCurrentProfile } from "@/lib/supabase/get-profile";
import { buildFillBlankTemplate } from "@/lib/listening/fill-blank";
import { FillBlankGame } from "@/components/listening/fill-blank-game";
import { submitScore } from "@/app/listening/actions";

export default async function ListeningFillBlankPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const clip = await getClipBySlug(slug);
  if (!clip) notFound();
  if (!clip.transcript) notFound();

  const words = await getWordsForClip(clip.id);
  const tokens = buildFillBlankTemplate(clip.transcript, words);
  const boundSubmit = submitScore.bind(null, clip.id, slug, "fill_blank");

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="mb-8 text-center text-2xl font-extrabold tracking-tight text-slate-900">
        {clip.title} — Fill in the blank
      </h1>
      <FillBlankGame tokens={tokens} backHref={`/listening/${slug}`} onSubmitScore={boundSubmit} />
    </div>
  );
}
