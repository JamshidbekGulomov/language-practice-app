import { notFound, redirect } from "next/navigation";
import { getPassageBySlug, getWordsForPassage } from "@/lib/reading/queries";
import { getCurrentProfile } from "@/lib/supabase/get-profile";
import { buildFillBlankTemplate } from "@/lib/fill-blank";
import { FillBlankGame } from "@/components/fill-blank-game";
import { submitScore } from "@/app/reading/actions";

export default async function ReadingFillBlankPage({
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
  const tokens = buildFillBlankTemplate(passage.body, words);
  const boundSubmit = submitScore.bind(null, passage.id, slug, "fill_blank");

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="mb-8 text-center text-2xl font-extrabold tracking-tight text-slate-900">
        {passage.title} — Fill in the blank
      </h1>
      <FillBlankGame tokens={tokens} backHref={`/reading/${slug}`} onSubmitScore={boundSubmit} />
    </div>
  );
}
