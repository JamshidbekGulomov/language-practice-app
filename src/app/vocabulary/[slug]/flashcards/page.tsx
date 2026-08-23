import { notFound, redirect } from "next/navigation";
import { getCategoryBySlug, getWordsForCategory } from "@/lib/vocabulary/queries";
import { getCurrentProfile } from "@/lib/supabase/get-profile";
import { FlashcardsGame } from "@/components/vocabulary/flashcards-game";

export default async function VocabFlashcardsPage({
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

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="mb-8 text-center text-2xl font-extrabold tracking-tight text-slate-900">
        {category.name} — Flashcards
      </h1>
      <FlashcardsGame words={words} categorySlug={slug} />
    </div>
  );
}
