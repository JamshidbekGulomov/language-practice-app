"use server";

import { revalidatePath } from "next/cache";
import { adminInsert, adminUpdate, adminDelete } from "@/lib/admin/crud";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/slugify";
import type {
  WritingLesson,
  GapFillExercise,
  SentencePrompt,
} from "@/lib/writing/types";

export async function createLesson(formData: FormData) {
  const title = (formData.get("title") as string)?.trim();
  const youtube_url = (formData.get("youtube_url") as string)?.trim();
  const description = ((formData.get("description") as string) || "").trim() || null;

  if (!title) throw new Error("Title is required");
  if (!youtube_url) throw new Error("YouTube link is required");

  await requireAdmin();
  const admin = createAdminClient();

  const baseSlug = slugify(title) || "lesson";
  let slug = baseSlug;
  let attempt = 1;
  while (true) {
    const { data } = await admin
      .from("writing_lessons")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!data) break;
    attempt += 1;
    slug = `${baseSlug}-${attempt}`;
  }

  await adminInsert<WritingLesson>("writing_lessons", {
    title,
    slug,
    youtube_url,
    description,
  });
  revalidatePath("/admin/writing");
  revalidatePath("/writing");
}

export async function deleteLesson(id: string) {
  await adminDelete("writing_lessons", id);
  revalidatePath("/admin/writing");
  revalidatePath("/writing");
}

export async function updateLesson(lessonId: string, formData: FormData) {
  const youtube_url = (formData.get("youtube_url") as string)?.trim();
  const description = ((formData.get("description") as string) || "").trim() || null;
  if (!youtube_url) throw new Error("YouTube link is required");

  await adminUpdate<WritingLesson>("writing_lessons", lessonId, { youtube_url, description });
  revalidatePath(`/admin/writing/${lessonId}`);
  revalidatePath("/writing");
}

export async function addGapFillExercise(lessonId: string, formData: FormData) {
  const prompt = (formData.get("prompt") as string)?.trim();
  const answer = (formData.get("answer") as string)?.trim();
  if (!prompt || !prompt.includes("___")) {
    throw new Error('Prompt must contain "___" to mark the blank');
  }
  if (!answer) throw new Error("Answer is required");

  await adminInsert<GapFillExercise>("writing_gap_fill_exercises", {
    lesson_id: lessonId,
    prompt,
    answer,
  });
  revalidatePath(`/admin/writing/${lessonId}`);
  revalidatePath("/writing");
}

export async function deleteGapFillExercise(lessonId: string, id: string) {
  await adminDelete("writing_gap_fill_exercises", id);
  revalidatePath(`/admin/writing/${lessonId}`);
  revalidatePath("/writing");
}

export async function addSentencePrompt(lessonId: string, formData: FormData) {
  const words = (formData.get("words") as string)?.trim();
  const model_answer = ((formData.get("model_answer") as string) || "").trim() || null;
  if (!words) throw new Error("Words are required");

  await adminInsert<SentencePrompt>("writing_sentence_prompts", {
    lesson_id: lessonId,
    words,
    model_answer,
  });
  revalidatePath(`/admin/writing/${lessonId}`);
  revalidatePath("/writing");
}

export async function deleteSentencePrompt(lessonId: string, id: string) {
  await adminDelete("writing_sentence_prompts", id);
  revalidatePath(`/admin/writing/${lessonId}`);
  revalidatePath("/writing");
}

export async function leaveFeedback(submissionId: string, formData: FormData) {
  const teacher_feedback = (formData.get("teacher_feedback") as string)?.trim();
  if (!teacher_feedback) throw new Error("Feedback can't be empty");

  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from("writing_sentence_submissions")
    .update({ teacher_feedback, reviewed_at: new Date().toISOString() })
    .eq("id", submissionId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/writing/review");
}
