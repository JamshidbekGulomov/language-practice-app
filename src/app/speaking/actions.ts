"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SPEAKING_AUDIO_BUCKET } from "@/lib/speaking/storage";

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

export async function submitRecording(topicId: string, topicSlug: string, audioPath: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be logged in to submit");

  const { error } = await supabase.from("speaking_submissions").insert({
    user_id: user.id,
    topic_id: topicId,
    audio_path: audioPath,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/speaking/${topicSlug}`);
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

export async function markSelfChecked(topicSlug: string, submissionId: string) {
  await updateOwnSubmission(submissionId, { self_checked: true });
  revalidatePath(`/speaking/${topicSlug}`);
}

export async function sendToTeacher(topicSlug: string, submissionId: string) {
  await updateOwnSubmission(submissionId, { sent_to_teacher: true });
  revalidatePath(`/speaking/${topicSlug}`);
  revalidatePath("/admin/speaking/review");
}
