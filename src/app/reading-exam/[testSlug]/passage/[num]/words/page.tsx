import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTestBySlug, getPassage, getWordsForPassage } from "@/lib/reading-exam/queries";
import { getCurrentProfile } from "@/lib/supabase/get-profile";
import { buildMultipleChoiceQuestions } from "@/lib/build-mc-questions";
import { buildFillBlankTemplate } from "@/lib/fill-blank";
import { sample, MATCHING_ROUND_SIZE } from "@/lib/sample";
import { MultipleChoiceGame } from "@/components/multiple-choice-game";
import { FillBlankGame } from "@/components/fill-blank-game";
import { MatchingGame } from "@/components/matching-game";

async function noop() {}

export default async function ReadingExamWordsPage({
  params,
  searchParams,
}: {
  params: Promise<{ testSlug: string; num: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const { testSlug, num } = await params;
  const { mode } = await searchParams;
  const passageNumber = Number(num);

  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const test = await getTestBySlug(testSlug);
  if (!test) notFound();
  const passage = await getPassage(test.id, passageNumber);
  if (!passage) notFound();

  const words = await getWordsForPassage(passage.id);
  const backHref = `/reading-exam/${testSlug}/passage/${passageNumber}/words`;

  if (mode === "multiple_choice") {
    const questions = buildMultipleChoiceQuestions(words);
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="mb-8 text-center text-2xl font-extrabold tracking-tight text-slate-900">
          {passage.title} — Multiple choice
        </h1>
        <MultipleChoiceGame questions={questions} backHref={backHref} onSubmitScore={noop} />
      </div>
    );
  }

  if (mode === "fill_blank") {
    const body = passage.paragraphs.map((p) => p.text).join("\n\n");
    const tokens = buildFillBlankTemplate(body, words);
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="mb-8 text-center text-2xl font-extrabold tracking-tight text-slate-900">
          {passage.title} — Fill in the blank
        </h1>
        <FillBlankGame tokens={tokens} backHref={backHref} onSubmitScore={noop} />
      </div>
    );
  }

  if (mode === "matching") {
    const withMeaning = words.filter((w) => w.meaning);
    const round = sample(withMeaning, Math.min(MATCHING_ROUND_SIZE, withMeaning.length));
    const pairs = round.map((w) => ({ id: w.id, left: w.word, right: w.meaning! }));
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="mb-8 text-center text-2xl font-extrabold tracking-tight text-slate-900">
          {passage.title} — Matching
        </h1>
        <MatchingGame pairs={pairs} backHref={backHref} backLabel="Back" onSubmitScore={noop} />
      </div>
    );
  }

  const withMeaning = words.filter((w) => w.meaning).length;
  const canMultipleChoice = withMeaning >= 4;
  const canMatch = withMeaning >= 2;
  const canFillBlank = words.length > 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{passage.title} — Word Practice</h1>
      <p className="mt-1 text-slate-500">
        {words.length} word{words.length === 1 ? "" : "s"} from this passage
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          href={canMultipleChoice ? `${backHref}?mode=multiple_choice` : "#"}
          aria-disabled={!canMultipleChoice}
          className={`rounded-xl border border-slate-200 bg-white p-5 text-center transition ${
            canMultipleChoice ? "hover:-translate-y-0.5 hover:shadow-md" : "pointer-events-none opacity-50"
          }`}
        >
          <p className="font-bold text-slate-900">Multiple choice</p>
          <p className="mt-1 text-xs text-slate-500">Pick the right meaning</p>
        </Link>
        <Link
          href={canFillBlank ? `${backHref}?mode=fill_blank` : "#"}
          aria-disabled={!canFillBlank}
          className={`rounded-xl border border-slate-200 bg-white p-5 text-center transition ${
            canFillBlank ? "hover:-translate-y-0.5 hover:shadow-md" : "pointer-events-none opacity-50"
          }`}
        >
          <p className="font-bold text-slate-900">Fill in the blank</p>
          <p className="mt-1 text-xs text-slate-500">Complete the passage</p>
        </Link>
        <Link
          href={canMatch ? `${backHref}?mode=matching` : "#"}
          aria-disabled={!canMatch}
          className={`rounded-xl border border-slate-200 bg-white p-5 text-center transition ${
            canMatch ? "hover:-translate-y-0.5 hover:shadow-md" : "pointer-events-none opacity-50"
          }`}
        >
          <p className="font-bold text-slate-900">Word matching</p>
          <p className="mt-1 text-xs text-slate-500">Word ↔ meaning</p>
        </Link>
      </div>

      <Link
        href={`/reading-exam/${testSlug}/passage/${passageNumber}`}
        className="mt-8 inline-block text-sm font-medium text-indigo-600 hover:underline"
      >
        &larr; Back to passage
      </Link>
    </div>
  );
}
