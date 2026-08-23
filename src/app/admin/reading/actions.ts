"use server";

import { revalidatePath } from "next/cache";
import { adminInsert, adminInsertMany, adminUpdate, adminDelete } from "@/lib/admin/crud";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/slugify";
import type { ReadingPassage, ReadingWord } from "@/lib/reading/types";

export async function createPassage(formData: FormData) {
  const title = (formData.get("title") as string)?.trim();
  const body = (formData.get("body") as string)?.trim();

  if (!title) throw new Error("Title is required");
  if (!body) throw new Error("Passage text is required");

  await requireAdmin();
  const admin = createAdminClient();

  const baseSlug = slugify(title) || "passage";
  let slug = baseSlug;
  let attempt = 1;
  while (true) {
    const { data } = await admin
      .from("reading_passages")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!data) break;
    attempt += 1;
    slug = `${baseSlug}-${attempt}`;
  }

  await adminInsert<ReadingPassage>("reading_passages", { title, slug, body });
  revalidatePath("/admin/reading");
  revalidatePath("/reading");
}

export async function deletePassage(id: string) {
  await adminDelete("reading_passages", id);
  revalidatePath("/admin/reading");
  revalidatePath("/reading");
}

export async function updateBody(passageId: string, formData: FormData) {
  const body = (formData.get("body") as string)?.trim();
  if (!body) throw new Error("Passage text is required");

  await adminUpdate<ReadingPassage>("reading_passages", passageId, { body });
  revalidatePath(`/admin/reading/${passageId}`);
  revalidatePath("/reading");
}

export async function addWord(passageId: string, formData: FormData) {
  const word = (formData.get("word") as string)?.trim();
  const meaning = ((formData.get("meaning") as string) || "").trim() || null;
  if (!word) throw new Error("Word is required");

  await adminInsert<ReadingWord>("reading_words", { passage_id: passageId, word, meaning });
  revalidatePath(`/admin/reading/${passageId}`);
  revalidatePath("/reading");
}

export async function deleteWord(passageId: string, id: string) {
  await adminDelete("reading_words", id);
  revalidatePath(`/admin/reading/${passageId}`);
  revalidatePath("/reading");
}

export type BulkReadingWordRow = { word: string; meaning?: string | null };

export async function bulkImportWords(passageId: string, rows: BulkReadingWordRow[]) {
  await requireAdmin();

  if (!Array.isArray(rows) || rows.length === 0) throw new Error("No rows to import");

  const cleaned = rows
    .map((r) => ({
      passage_id: passageId,
      word: String(r.word ?? "").trim().slice(0, 200),
      meaning: r.meaning ? String(r.meaning).trim().slice(0, 300) : null,
    }))
    .filter((r) => r.word);

  if (cleaned.length === 0) throw new Error("No valid rows found (Word is required in every row)");

  await adminInsertMany("reading_words", cleaned);
  revalidatePath(`/admin/reading/${passageId}`);
  revalidatePath("/reading");

  return { imported: cleaned.length, skipped: rows.length - cleaned.length };
}
