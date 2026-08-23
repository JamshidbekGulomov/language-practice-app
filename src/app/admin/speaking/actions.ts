"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { adminInsert, adminInsertMany, adminUpdate, adminDelete } from "@/lib/admin/crud";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/slugify";
import { isSpeakingExam, getPartDef } from "@/lib/speaking/exams";
import { SPEAKING_IMAGES_BUCKET } from "@/lib/speaking/storage";
import type { SpeakingTopic, SpeakingQuestion, SpeakingHint, SpeakingImage } from "@/lib/speaking/types";

export async function createTopic(formData: FormData) {
  const title = (formData.get("title") as string)?.trim();
  const prompt = (formData.get("prompt") as string)?.trim();
  const examRaw = (formData.get("exam") as string)?.trim();
  const part = (formData.get("part") as string)?.trim();

  if (!title) throw new Error("Title is required");
  if (!prompt) throw new Error("Prompt is required");
  if (!examRaw || !isSpeakingExam(examRaw)) throw new Error("Choose an exam");
  const partDef = part ? getPartDef(examRaw, part) : undefined;
  if (!partDef) throw new Error("Choose a valid part for that exam");

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

  await adminInsert<SpeakingTopic>("speaking_topics", {
    title,
    slug,
    prompt,
    exam: examRaw,
    part: partDef.key,
    format: partDef.format,
  });
  revalidatePath("/admin/speaking");
  revalidatePath(`/speaking/${examRaw}`);
}

export async function deleteTopic(id: string) {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: topic } = await admin
    .from("speaking_topics")
    .select("exam")
    .eq("id", id)
    .maybeSingle();

  const { data: images } = await admin
    .from("speaking_images")
    .select("image_path")
    .eq("topic_id", id);
  if (images?.length) {
    await admin.storage.from(SPEAKING_IMAGES_BUCKET).remove(images.map((i) => i.image_path));
  }

  await adminDelete("speaking_topics", id);
  revalidatePath("/admin/speaking");
  if (topic?.exam) revalidatePath(`/speaking/${topic.exam}`);
}

export async function updateTopicPrompt(topicId: string, formData: FormData) {
  const prompt = (formData.get("prompt") as string)?.trim();
  if (!prompt) throw new Error("Prompt is required");

  await adminUpdate<SpeakingTopic>("speaking_topics", topicId, { prompt });
  revalidatePath(`/admin/speaking/${topicId}`);
}

export async function addQuestion(topicId: string, formData: FormData) {
  const question = (formData.get("question") as string)?.trim();
  if (!question) throw new Error("Question is required");

  await requireAdmin();
  const admin = createAdminClient();

  const { data: topic } = await admin
    .from("speaking_topics")
    .select("exam, part")
    .eq("id", topicId)
    .maybeSingle();
  if (!topic) throw new Error("Topic not found");

  const partDef = isSpeakingExam(topic.exam) ? getPartDef(topic.exam, topic.part) : undefined;
  if (partDef?.questionCount === 0) {
    throw new Error("This part doesn't use questions");
  }
  if (typeof partDef?.questionCount === "number" && partDef.questionCount > 0) {
    const { count } = await admin
      .from("speaking_questions")
      .select("id", { count: "exact", head: true })
      .eq("topic_id", topicId);
    if ((count ?? 0) >= partDef.questionCount) {
      throw new Error(`This part allows exactly ${partDef.questionCount} questions`);
    }
  }

  await adminInsert<SpeakingQuestion>("speaking_questions", { topic_id: topicId, question });
  revalidatePath(`/admin/speaking/${topicId}`);
}

export async function deleteQuestion(topicId: string, id: string) {
  await adminDelete("speaking_questions", id);
  revalidatePath(`/admin/speaking/${topicId}`);
}

export async function addHint(topicId: string, formData: FormData) {
  const word = (formData.get("word") as string)?.trim();
  const meaning = ((formData.get("meaning") as string) || "").trim() || null;
  if (!word) throw new Error("Word is required");

  await adminInsert<SpeakingHint>("speaking_hints", { topic_id: topicId, word, meaning });
  revalidatePath(`/admin/speaking/${topicId}`);
}

export async function deleteHint(topicId: string, id: string) {
  await adminDelete("speaking_hints", id);
  revalidatePath(`/admin/speaking/${topicId}`);
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

  return { imported: cleaned.length, skipped: rows.length - cleaned.length };
}

/**
 * Vercel Serverless Functions cap request bodies at 4.5MB, so image files
 * can't go through a Server Action directly — the browser uploads
 * straight to Supabase Storage using a short-lived signed URL, same
 * pattern as the Listening admin audio upload flow.
 */
export async function createImageUploadUrl(fileName: string) {
  await requireAdmin();
  const admin = createAdminClient();

  const ext = fileName.includes(".") ? fileName.split(".").pop() : "jpg";
  const path = `${randomUUID()}.${ext}`;

  const { data, error } = await admin.storage.from(SPEAKING_IMAGES_BUCKET).createSignedUploadUrl(path);
  if (error) throw new Error(error.message);

  return { path, token: data.token };
}

export async function addImage(topicId: string, imagePath: string) {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: topic } = await admin
    .from("speaking_topics")
    .select("exam, part")
    .eq("id", topicId)
    .maybeSingle();
  if (!topic) throw new Error("Topic not found");

  const partDef = isSpeakingExam(topic.exam) ? getPartDef(topic.exam, topic.part) : undefined;
  const cap = partDef?.imageCount ?? 0;

  const { count } = await admin
    .from("speaking_images")
    .select("id", { count: "exact", head: true })
    .eq("topic_id", topicId);
  if (cap && (count ?? 0) >= cap) {
    throw new Error(`This part allows at most ${cap} image${cap === 1 ? "" : "s"}`);
  }

  await adminInsert<SpeakingImage>("speaking_images", {
    topic_id: topicId,
    image_path: imagePath,
    position: count ?? 0,
  });
  revalidatePath(`/admin/speaking/${topicId}`);
}

export async function deleteImage(topicId: string, id: string) {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: image } = await admin
    .from("speaking_images")
    .select("image_path")
    .eq("id", id)
    .maybeSingle();
  if (image?.image_path) {
    await admin.storage.from(SPEAKING_IMAGES_BUCKET).remove([image.image_path]);
  }

  await adminDelete("speaking_images", id);
  revalidatePath(`/admin/speaking/${topicId}`);
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
