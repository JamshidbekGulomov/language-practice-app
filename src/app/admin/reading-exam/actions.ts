"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { adminInsert, adminInsertMany, adminUpdate, adminDelete } from "@/lib/admin/crud";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/slugify";
import { isExam } from "@/lib/exam";
import { analyzeReadingExamPdf, suggestWordsFromText } from "@/lib/ai/gemini";
import type {
  ReadingExamTest,
  ReadingExamPassage,
  ReadingExamWord,
  Paragraph,
  GlossaryTerm,
  QuestionGroup,
  ParaphrasePair,
} from "@/lib/reading-exam/types";

const ADMIN_UPLOADS_BUCKET = "admin-uploads";

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

export async function createPdfUploadUrl(fileName: string) {
  await requireAdmin();
  const admin = createAdminClient();

  const ext = fileName.includes(".") ? fileName.split(".").pop() : "pdf";
  const path = `${randomUUID()}.${ext}`;

  const { data, error } = await admin.storage.from(ADMIN_UPLOADS_BUCKET).createSignedUploadUrl(path);
  if (error) throw new Error(error.message);

  return { path, token: data.token };
}

export type PassageAiDraft = {
  title: string;
  subtitle: string;
  paragraphs: Paragraph[];
  glossary: GlossaryTerm[];
  question_groups: QuestionGroup[];
  paraphrase_pairs: ParaphrasePair[];
};

/**
 * Downloads the just-uploaded PDF, sends it to Gemini for full extraction
 * (passage, question groups, best-guess answers), converts the result into
 * this app's QuestionGroup shape, and deletes the temp upload. The admin
 * still has to hit "Save passage" — this only pre-fills the editor.
 */
export async function analyzePassageWithAi(path: string): Promise<PassageAiDraft> {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: file, error: downloadError } = await admin.storage.from(ADMIN_UPLOADS_BUCKET).download(path);
  if (downloadError || !file) throw new Error(downloadError?.message || "Could not read the uploaded PDF");

  const buffer = Buffer.from(await file.arrayBuffer());
  const draft = await analyzeReadingExamPdf(buffer.toString("base64"));

  admin.storage.from(ADMIN_UPLOADS_BUCKET).remove([path]).catch(() => {});

  const question_groups: QuestionGroup[] = [];
  if (draft.matching_headings.present) {
    question_groups.push({
      type: "matching_headings",
      label: draft.matching_headings.label || "Matching Headings",
      startQuestion: draft.matching_headings.startQuestion || 1,
      headings: draft.matching_headings.headings,
      items: draft.matching_headings.items.map((it, i) => ({
        question: (draft.matching_headings.startQuestion || 1) + i,
        paragraphLetter: it.paragraphLetter,
        answerCode: it.answerCode,
      })),
    });
  }
  if (draft.matching_features.present) {
    question_groups.push({
      type: "matching_features",
      label: draft.matching_features.label || "Matching Features",
      startQuestion: draft.matching_features.startQuestion || 1,
      statements: draft.matching_features.statements,
      items: draft.matching_features.items.map((it, i) => ({
        question: (draft.matching_features.startQuestion || 1) + i,
        personOrFeature: it.personOrFeature,
        answerCode: it.answerCode,
      })),
    });
  }
  if (draft.summary_completion.present) {
    question_groups.push({
      type: "summary_completion",
      label: draft.summary_completion.label || "Summary Completion",
      startQuestion: draft.summary_completion.startQuestion || 1,
      title: draft.summary_completion.title,
      text: draft.summary_completion.text,
      answers: draft.summary_completion.answers,
    });
  }

  return {
    title: draft.title,
    subtitle: draft.subtitle,
    paragraphs: draft.paragraphs,
    glossary: draft.glossary.map((g) => ({ word: g.word, def: g.def, syn: g.syn ?? "", uz: g.uz ?? "" })),
    question_groups,
    paraphrase_pairs: draft.paraphrase_pairs,
  };
}

export async function suggestWords(text: string): Promise<{ word: string; meaning: string }[]> {
  await requireAdmin();
  if (!text.trim()) return [];
  return suggestWordsFromText(text);
}

export async function addWordsBulk(passageId: string, words: { word: string; meaning: string }[]) {
  const cleaned = words
    .map((w) => ({ passage_id: passageId, word: w.word.trim(), meaning: w.meaning.trim() || null }))
    .filter((w) => w.word);
  if (cleaned.length === 0) return;

  await adminInsertMany<ReadingExamWord>("reading_exam_words", cleaned);
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
