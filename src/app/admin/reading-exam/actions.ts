"use server";

import { revalidatePath } from "next/cache";
import { adminInsert, adminUpdate, adminDelete } from "@/lib/admin/crud";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/slugify";
import { isExam } from "@/lib/exam";
import type {
  ReadingExamTest,
  ReadingExamPassage,
  ReadingExamWord,
  Paragraph,
  GlossaryTerm,
  QuestionGroup,
  ParaphrasePair,
} from "@/lib/reading-exam/types";

export async function createTest(formData: FormData) {
  const title = (formData.get("title") as string)?.trim();
  const examRaw = (formData.get("exam") as string) || "";
  if (!title) throw new Error("Title is required");
  if (!isExam(examRaw)) throw new Error("A valid exam is required");

  await requireAdmin();
  const admin = createAdminClient();

  const baseSlug = slugify(title) || "test";
  let slug = baseSlug;
  let attempt = 1;
  while (true) {
    const { data } = await admin.from("reading_exam_tests").select("id").eq("slug", slug).maybeSingle();
    if (!data) break;
    attempt += 1;
    slug = `${baseSlug}-${attempt}`;
  }

  const test = await adminInsert<ReadingExamTest>("reading_exam_tests", { title, slug, exam: examRaw });
  for (let n = 1; n <= 3; n++) {
    await adminInsert<ReadingExamPassage>("reading_exam_passages", {
      test_id: test.id,
      passage_number: n,
      title: `Passage ${n}`,
      subtitle: null,
      paragraphs: [],
      glossary: [],
      question_groups: [],
      paraphrase_pairs: [],
    });
  }

  revalidatePath("/admin/reading-exam");
  revalidatePath(`/${examRaw}/reading`);
}

export async function deleteTest(id: string) {
  await adminDelete("reading_exam_tests", id);
  revalidatePath("/admin/reading-exam");
}

export type PassageInput = {
  title: string;
  subtitle: string | null;
  paragraphs: Paragraph[];
  glossary: GlossaryTerm[];
  question_groups: QuestionGroup[];
  paraphrase_pairs: ParaphrasePair[];
};

export async function updatePassage(passageId: string, input: PassageInput) {
  await requireAdmin();
  if (!input.title?.trim()) throw new Error("Title is required");

  await adminUpdate<ReadingExamPassage>("reading_exam_passages", passageId, {
    title: input.title.trim(),
    subtitle: input.subtitle?.trim() || null,
    paragraphs: input.paragraphs,
    glossary: input.glossary,
    question_groups: input.question_groups,
    paraphrase_pairs: input.paraphrase_pairs,
  });

  revalidatePath("/admin/reading-exam");
}

export async function addWord(passageId: string, formData: FormData) {
  const word = (formData.get("word") as string)?.trim();
  const meaning = ((formData.get("meaning") as string) || "").trim() || null;
  if (!word) throw new Error("Word is required");

  await adminInsert<ReadingExamWord>("reading_exam_words", { passage_id: passageId, word, meaning });
  revalidatePath("/admin/reading-exam");
}

export async function deleteWord(id: string) {
  await adminDelete("reading_exam_words", id);
  revalidatePath("/admin/reading-exam");
}
