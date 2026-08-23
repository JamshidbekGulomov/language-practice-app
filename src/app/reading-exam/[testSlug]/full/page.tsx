import { notFound, redirect } from "next/navigation";
import { getTestBySlug, getPassagesForTest } from "@/lib/reading-exam/queries";
import { getCurrentProfile } from "@/lib/supabase/get-profile";
import { ExamPlayer } from "@/components/reading-exam/exam-player";

export default async function ReadingExamFullPage({
  params,
}: {
  params: Promise<{ testSlug: string }>;
}) {
  const { testSlug } = await params;

  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const test = await getTestBySlug(testSlug);
  if (!test) notFound();

  const passages = await getPassagesForTest(test.id);
  if (passages.length === 0) notFound();

  return (
    <ExamPlayer
      testId={test.id}
      testTitle={test.title}
      scopeLabel="Full Exam"
      scope="full"
      passageNumber={null}
      passages={passages}
      backHref={`/reading-exam/${testSlug}`}
    />
  );
}
