"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function submitGapFillResult(
  lessonId: string,
  lessonSlug: string,
  score: number,
  total: number,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be logged in to save progress");

  const { error } = await supabase.from("writing_gap_fill_results").insert({
    user_id: user.id,
    lesson_id: lessonId,
    score,
    total,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/writing/${lessonSlug}`);
}

export async function submitSentence(
  lessonId: string,
  lessonSlug: string,
  promptId: string,
  text: string,
) {
  const trimmed = text.trim();
  if (!trimmed) throw new Error("Write a sentence first");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be logged in to submit");

  const { error } = await supabase.from("writing_sentence_submissions").insert({
    user_id: user.id,
    prompt_id: promptId,
    lesson_id: lessonId,
    submission: trimmed,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/writing/${lessonSlug}`);
}

/** Verifies ownership server-side, then writes via the service-role client — no student UPDATE RLS policy exists on this table. */
async function updateOwnSubmission(submissionId: string, values: Record<string, unknown>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be logged in");

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("writing_sentence_submissions")
    .select("user_id")
    .eq("id", submissionId)
    .maybeSingle();
  if (!existing || existing.user_id !== user.id) throw new Error("Not found");

  const { error } = await admin
    .from("writing_sentence_submissions")
    .update(values)
    .eq("id", submissionId);
  if (error) throw new Error(error.message);
}

export async function markSelfChecked(lessonSlug: string, submissionId: string) {
  await updateOwnSubmission(submissionId, { self_checked: true });
  revalidatePath(`/writing/${lessonSlug}`);
}

export async function sendToTeacher(lessonSlug: string, submissionId: string) {
  await updateOwnSubmission(submissionId, { sent_to_teacher: true });
  revalidatePath(`/writing/${lessonSlug}`);
  revalidatePath("/admin/writing/review");
}
