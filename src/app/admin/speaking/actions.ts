"use server";

import { revalidatePath } from "next/cache";
import { adminInsert, adminInsertMany, adminUpdate, adminDelete } from "@/lib/admin/crud";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/slugify";
import type { SpeakingTopic, SpeakingQuestion, SpeakingHint } from "@/lib/speaking/types";

export async function createTopic(formData: FormData) {
  const title = (formData.get("title") as string)?.trim();
  const prompt = (formData.get("prompt") as string)?.trim();
  if (!title) throw new Error("Title is required");
  if (!prompt) throw new Error("Prompt is required");

  await requireAdmin();
  const admin = createAdminClient();

  const baseSlug = slugify(title) || "topic";
  let slug = baseSlug;
  let attempt = 1;
  while (true) {
    const { data } = await admin
      .from("speaking_topics")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!data) break;
    attempt += 1;
    slug = `${baseSlug}-${attempt}`;
  }

  await adminInsert<SpeakingTopic>("speaking_topics", { title, slug, prompt });
  revalidatePath("/admin/speaking");
  revalidatePath("/speaking");
}

export async function deleteTopic(id: string) {
  await adminDelete("speaking_topics", id);
  revalidatePath("/admin/speaking");
  revalidatePath("/speaking");
}

export async function updateTopicPrompt(topicId: string, formData: FormData) {
  const prompt = (formData.get("prompt") as string)?.trim();
  if (!prompt) throw new Error("Prompt is required");

  await adminUpdate<SpeakingTopic>("speaking_topics", topicId, { prompt });
  revalidatePath(`/admin/speaking/${topicId}`);
  revalidatePath("/speaking");
}

export async function addQuestion(topicId: string, formData: FormData) {
  const question = (formData.get("question") as string)?.trim();
  if (!question) throw new Error("Question is required");

  await adminInsert<SpeakingQuestion>("speaking_questions", { topic_id: topicId, question });
  revalidatePath(`/admin/speaking/${topicId}`);
  revalidatePath("/speaking");
}

export async function deleteQuestion(topicId: string, id: string) {
  await adminDelete("speaking_questions", id);
  revalidatePath(`/admin/speaking/${topicId}`);
  revalidatePath("/speaking");
}

export async function addHint(topicId: string, formData: FormData) {
  const word = (formData.get("word") as string)?.trim();
  const meaning = ((formData.get("meaning") as string) || "").trim() || null;
  if (!word) throw new Error("Word is required");

  await adminInsert<SpeakingHint>("speaking_hints", { topic_id: topicId, word, meaning });
  revalidatePath(`/admin/speaking/${topicId}`);
  revalidatePath("/speaking");
}

export async function deleteHint(topicId: string, id: string) {
  await adminDelete("speaking_hints", id);
  revalidatePath(`/admin/speaking/${topicId}`);
  revalidatePath("/speaking");
}

export type BulkSpeakingHintRow = { word: string; meaning?: string | null };

export async function bulkImportHints(topicId: string, rows: BulkSpeakingHintRow[]) {
  await requireAdmin();

  if (!Array.isArray(rows) || rows.length === 0) throw new Error("No rows to import");

  const cleaned = rows
    .map((r) => ({
      topic_id: topicId,
      word: String(r.word ?? "").trim().slice(0, 200),
      meaning: r.meaning ? String(r.meaning).trim().slice(0, 300) : null,
    }))
    .filter((r) => r.word);

  if (cleaned.length === 0) throw new Error("No valid rows found (Word is required in every row)");

  await adminInsertMany("speaking_hints", cleaned);
  revalidatePath(`/admin/speaking/${topicId}`);
  revalidatePath("/speaking");

  return { imported: cleaned.length, skipped: rows.length - cleaned.length };
}

export async function leaveFeedback(submissionId: string, formData: FormData) {
  const teacher_feedback = (formData.get("teacher_feedback") as string)?.trim();
  if (!teacher_feedback) throw new Error("Feedback can't be empty");

  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from("speaking_submissions")
    .update({ teacher_feedback, reviewed_at: new Date().toISOString() })
    .eq("id", submissionId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/speaking/review");
}
