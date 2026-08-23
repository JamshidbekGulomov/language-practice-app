import { notFound, redirect } from "next/navigation";
import { getTestBySlug, getSectionsForTest, getMyNote } from "@/lib/listening-exam/queries";
import { getCurrentProfile } from "@/lib/supabase/get-profile";
import { ListeningExamPlayer } from "@/components/listening-exam/exam-player";

export default async function ListeningExamTestPage({
  params,
}: {
  params: Promise<{ testSlug: string }>;
}) {
  const { testSlug } = await params;

  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const test = await getTestBySlug(testSlug);
  if (!test) notFound();

  const [sections, note] = await Promise.all([
    getSectionsForTest(test.id),
    getMyNote(profile.id, test.id),
  ]);
  if (sections.length === 0) notFound();

  return <ListeningExamPlayer test={test} sections={sections} initialNote={note?.content ?? ""} />;
}
