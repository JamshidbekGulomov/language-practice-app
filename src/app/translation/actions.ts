"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function submitTranslation(
  levelId: string,
  levelSlug: string,
  sentenceId: string,
  text: string,
) {
  const trimmed = text.trim();
  if (!trimmed) throw new Error("Write your translation first");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be logged in to submit");

  const { error } = await supabase.from("translation_submissions").insert({
    user_id: user.id,
    sentence_id: sentenceId,
    level_id: levelId,
    submission: trimmed,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/translation/${levelSlug}`);
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
    .from("translation_submissions")
    .select("user_id")
    .eq("id", submissionId)
    .maybeSingle();
  if (!existing || existing.user_id !== user.id) throw new Error("Not found");

  const { error } = await admin
    .from("translation_submissions")
    .update(values)
    .eq("id", submissionId);
  if (error) throw new Error(error.message);
}

export async function markSelfChecked(levelSlug: string, submissionId: string) {
  await updateOwnSubmission(submissionId, { self_checked: true });
  revalidatePath(`/translation/${levelSlug}`);
}

export async function sendToTeacher(levelSlug: string, submissionId: string) {
  await updateOwnSubmission(submissionId, { sent_to_teacher: true });
  revalidatePath(`/translation/${levelSlug}`);
  revalidatePath("/admin/translation/review");
}
