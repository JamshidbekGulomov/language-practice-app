import { notFound, redirect } from "next/navigation";
import { getTestBySlug, getPassage } from "@/lib/reading-exam/queries";
import { getCurrentProfile } from "@/lib/supabase/get-profile";
import { SynonymPractice } from "@/components/reading-exam/synonym-practice";

export default async function ReadingExamSynonymsPage({
  params,
}: {
  params: Promise<{ testSlug: string; num: string }>;
}) {
  const { testSlug, num } = await params;
  const passageNumber = Number(num);

  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const test = await getTestBySlug(testSlug);
  if (!test) notFound();
  const passage = await getPassage(test.id, passageNumber);
  if (!passage) notFound();

  return (
    <SynonymPractice
      passage={passage}
      backHref={`/reading-exam/${testSlug}/passage/${passageNumber}`}
    />
  );
}
