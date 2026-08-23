"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SPEAKING_AUDIO_BUCKET } from "@/lib/speaking/storage";
import { analyzeSpeakingAudio } from "@/lib/ai/gemini";

/**
 * Vercel Serverless Functions cap request bodies at 4.5MB, so the recorded
 * clip can't go through a Server Action directly — the browser uploads
 * straight to Supabase Storage using a short-lived signed URL, same
 * pattern as the Listening admin upload flow.
 */
export async function createUploadUrl(extension: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be logged in to record");

  const admin = createAdminClient();
  const safeExt = extension.replace(/[^a-z0-9]/gi, "").slice(0, 10) || "webm";
  const path = `${user.id}/${randomUUID()}.${safeExt}`;

  const { data, error } = await admin.storage
    .from(SPEAKING_AUDIO_BUCKET)
    .createSignedUploadUrl(path);
  if (error) throw new Error(error.message);

  return { path, token: data.token };
}

export async function submitRecording(
  topicId: string,
  topicPath: string,
  audioPath: string,
  questionId?: string,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be logged in to submit");

  const { data, error } = await supabase
    .from("speaking_submissions")
    .insert({
      user_id: user.id,
      topic_id: topicId,
      question_id: questionId ?? null,
      audio_path: audioPath,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  revalidatePath(topicPath);
  return data.id as string;
}

/**
 * Best-effort AI transcript + feedback, run right after a student submits a
 * recording. Never throws to the caller — if Gemini isn't configured or the
 * request fails, the submission itself already succeeded and just won't
 * have an AI pass; the student's own recording is never blocked on this.
 */
export async function analyzeSubmission(topicPath: string, submissionId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const admin = createAdminClient();
  const { data: submission } = await admin
    .from("speaking_submissions")
    .select("user_id, audio_path")
    .eq("id", submissionId)
    .maybeSingle();
  if (!submission || submission.user_id !== user.id) return;

  try {
    const { data: file, error: downloadError } = await admin.storage
      .from(SPEAKING_AUDIO_BUCKET)
      .download(submission.audio_path);
    if (downloadError || !file) return;

    const buffer = Buffer.from(await file.arrayBuffer());
    const analysis = await analyzeSpeakingAudio(buffer.toString("base64"), file.type || "audio/webm");

    await admin
      .from("speaking_submissions")
      .update({ ai_transcript: analysis.transcript, ai_feedback: analysis.feedback })
      .eq("id", submissionId);

    revalidatePath(topicPath);
  } catch {
    // Gemini not configured or the request failed — leave ai_transcript/ai_feedback null.
  }
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
    .from("speaking_submissions")
    .select("user_id")
    .eq("id", submissionId)
    .maybeSingle();
  if (!existing || existing.user_id !== user.id) throw new Error("Not found");

  const { error } = await admin
    .from("speaking_submissions")
    .update(values)
    .eq("id", submissionId);
  if (error) throw new Error(error.message);
}

export async function markSelfChecked(topicPath: string, submissionId: string) {
  await updateOwnSubmission(submissionId, { self_checked: true });
  revalidatePath(topicPath);
}

export async function sendToTeacher(topicPath: string, submissionId: string) {
  await updateOwnSubmission(submissionId, { sent_to_teacher: true });
  revalidatePath(topicPath);
  revalidatePath("/admin/speaking/review");
}
