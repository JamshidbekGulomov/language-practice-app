import { notFound } from "next/navigation";
import { adminList } from "@/lib/admin/crud";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { PassageEditor } from "@/components/admin/reading-exam/passage-editor";
import type { ReadingExamTest, ReadingExamPassage, ReadingExamWord } from "@/lib/reading-exam/types";

/**
 * Server Actions inherit the page's timeout, not the "use server" file's —
 * the AI PDF analysis/word-suggestion actions call Gemini with a large
 * multimodal prompt and can take well over the platform default (10-15s),
 * which otherwise kills the request mid-flight with no usable error.
 */
export const maxDuration = 60;

export default async function AdminReadingExamPassagePage({
  params,
}: {
  params: Promise<{ id: string; num: string }>;
}) {
  const { id, num } = await params;
  const passageNumber = Number(num);
  if (![1, 2, 3].includes(passageNumber)) notFound();

  const [tests, passages] = await Promise.all([
    adminList<ReadingExamTest>("reading_exam_tests", { eq: { id } }),
    adminList<ReadingExamPassage>("reading_exam_passages", {
      eq: { test_id: id, passage_number: passageNumber },
    }),
  ]);
  const test = tests[0];
  const passage = passages[0];
  if (!test || !passage) notFound();

  const words = await adminList<ReadingExamWord>("reading_exam_words", { eq: { passage_id: passage.id } });

  return (
    <div>
      <AdminPageHeader title={`${test.title} — Passage ${passageNumber}`} />
      <PassageEditor passage={passage} words={words} />
    </div>
  );
}
