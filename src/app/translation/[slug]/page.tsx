import Link from "next/link";
import { notFound } from "next/navigation";
import { getLevelBySlug, getSentences, getMySubmissions } from "@/lib/translation/queries";
import { getCurrentProfile } from "@/lib/supabase/get-profile";
import { SentenceExercises } from "@/components/translation/sentence-exercises";
import { submitTranslation, markSelfChecked, sendToTeacher } from "@/app/translation/actions";

export default async function TranslationLevelPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const level = await getLevelBySlug(slug);
  if (!level) notFound();

  const [profile, sentences, submissionsMap] = await Promise.all([
    getCurrentProfile(),
    getSentences(level.id),
    getMySubmissions(level.id),
  ]);

  const submissions = Object.fromEntries(submissionsMap);

  const boundSubmit = submitTranslation.bind(null, level.id, slug);
  const boundMarkSelfChecked = markSelfChecked.bind(null, slug);
  const boundSendToTeacher = sendToTeacher.bind(null, slug);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{level.title}</h1>
      {level.description && <p className="mt-1 text-slate-500">{level.description}</p>}

      {!profile && (
        <p className="mt-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <Link href="/login" className="font-semibold underline">
            Log in
          </Link>{" "}
          to do the exercises and save your progress.
        </p>
      )}

      {profile && (
        <div className="mt-8">
          <SentenceExercises
            sentences={sentences}
            submissions={submissions}
            onSubmit={boundSubmit}
            onMarkSelfChecked={boundMarkSelfChecked}
            onSendToTeacher={boundSendToTeacher}
          />
        </div>
      )}
    </div>
  );
}
