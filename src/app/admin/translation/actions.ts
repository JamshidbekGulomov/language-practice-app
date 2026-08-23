"use server";

import { revalidatePath } from "next/cache";
import { adminInsert, adminInsertMany, adminUpdate, adminDelete } from "@/lib/admin/crud";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/slugify";
import type { TranslationLevel, TranslationSentence } from "@/lib/translation/types";

export async function createLevel(formData: FormData) {
  const title = (formData.get("title") as string)?.trim();
  const description = ((formData.get("description") as string) || "").trim() || null;
  if (!title) throw new Error("Title is required");

  await requireAdmin();
  const admin = createAdminClient();

  const baseSlug = slugify(title) || "level";
  let slug = baseSlug;
  let attempt = 1;
  while (true) {
    const { data } = await admin
      .from("translation_levels")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!data) break;
    attempt += 1;
    slug = `${baseSlug}-${attempt}`;
  }

  await adminInsert<TranslationLevel>("translation_levels", { title, slug, description });
  revalidatePath("/admin/translation");
  revalidatePath("/translation");
}

export async function deleteLevel(id: string) {
  await adminDelete("translation_levels", id);
  revalidatePath("/admin/translation");
  revalidatePath("/translation");
}

export async function updateLevel(levelId: string, formData: FormData) {
  const description = ((formData.get("description") as string) || "").trim() || null;
  await adminUpdate<TranslationLevel>("translation_levels", levelId, { description });
  revalidatePath(`/admin/translation/${levelId}`);
  revalidatePath("/translation");
}

export async function addSentence(levelId: string, formData: FormData) {
  const uzbek_text = (formData.get("uzbek_text") as string)?.trim();
  const model_answer = ((formData.get("model_answer") as string) || "").trim() || null;
  if (!uzbek_text) throw new Error("Sentence is required");

  await adminInsert<TranslationSentence>("translation_sentences", {
    level_id: levelId,
    uzbek_text,
    model_answer,
  });
  revalidatePath(`/admin/translation/${levelId}`);
  revalidatePath("/translation");
}

export async function deleteSentence(levelId: string, id: string) {
  await adminDelete("translation_sentences", id);
  revalidatePath(`/admin/translation/${levelId}`);
  revalidatePath("/translation");
}

export type BulkTranslationSentenceRow = { uzbek_text: string; model_answer?: string | null };

export async function bulkImportSentences(levelId: string, rows: BulkTranslationSentenceRow[]) {
  await requireAdmin();

  if (!Array.isArray(rows) || rows.length === 0) throw new Error("No rows to import");

  const cleaned = rows
    .map((r) => ({
      level_id: levelId,
      uzbek_text: String(r.uzbek_text ?? "").trim().slice(0, 500),
      model_answer: r.model_answer ? String(r.model_answer).trim().slice(0, 500) : null,
    }))
    .filter((r) => r.uzbek_text);

  if (cleaned.length === 0) {
    throw new Error("No valid rows found (Uzbek sentence is required in every row)");
  }

  await adminInsertMany("translation_sentences", cleaned);
  revalidatePath(`/admin/translation/${levelId}`);
  revalidatePath("/translation");

  return { imported: cleaned.length, skipped: rows.length - cleaned.length };
}

export async function leaveFeedback(submissionId: string, formData: FormData) {
  const teacher_feedback = (formData.get("teacher_feedback") as string)?.trim();
  if (!teacher_feedback) throw new Error("Feedback can't be empty");

  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from("translation_submissions")
    .update({ teacher_feedback, reviewed_at: new Date().toISOString() })
    .eq("id", submissionId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/translation/review");
}
