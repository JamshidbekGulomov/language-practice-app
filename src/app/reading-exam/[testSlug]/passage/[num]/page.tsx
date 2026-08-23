import { notFound, redirect } from "next/navigation";
import { getTestBySlug, getPassage } from "@/lib/reading-exam/queries";
import { getCurrentProfile } from "@/lib/supabase/get-profile";
import { ExamPlayer } from "@/components/reading-exam/exam-player";

export default async function ReadingExamPassagePage({
  params,
}: {
  params: Promise<{ testSlug: string; num: string }>;
}) {
  const { testSlug, num } = await params;
  const passageNumber = Number(num);
  if (![1, 2, 3].includes(passageNumber)) notFound();

  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const test = await getTestBySlug(testSlug);
  if (!test) notFound();

  const passage = await getPassage(test.id, passageNumber);
  if (!passage) notFound();

  return (
    <ExamPlayer
      testId={test.id}
      testTitle={test.title}
      scopeLabel={`Passage ${passageNumber}`}
      scope="passage"
      passageNumber={passageNumber}
      passages={[passage]}
      backHref={`/reading-exam/${testSlug}`}
      wordsHref={`/reading-exam/${testSlug}/passage/${passageNumber}/words`}
      synonymsHref={`/reading-exam/${testSlug}/passage/${passageNumber}/synonyms`}
    />
  );
}
