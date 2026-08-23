"use server";

import { revalidatePath } from "next/cache";
import { adminInsert, adminInsertMany, adminDelete } from "@/lib/admin/crud";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/slugify";
import type { VocabCategory, VocabWord } from "@/lib/vocabulary/types";

export async function createCategory(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  if (!name) throw new Error("Name is required");

  await requireAdmin();
  const admin = createAdminClient();

  const baseSlug = slugify(name) || "category";
  let slug = baseSlug;
  let attempt = 1;
  while (true) {
    const { data } = await admin
      .from("vocab_categories")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!data) break;
    attempt += 1;
    slug = `${baseSlug}-${attempt}`;
  }

  await adminInsert<VocabCategory>("vocab_categories", { name, slug });
  revalidatePath("/admin/vocabulary");
  revalidatePath("/vocabulary");
}

export async function deleteCategory(id: string) {
  await adminDelete("vocab_categories", id);
  revalidatePath("/admin/vocabulary");
  revalidatePath("/vocabulary");
}

export type BulkWordRow = {
  english: string;
  uzbek: string;
  synonym?: string | null;
  example_sentence?: string | null;
  difficulty?: string | null;
};

export async function addWord(categoryId: string, formData: FormData) {
  const english = (formData.get("english") as string)?.trim();
  const uzbek = (formData.get("uzbek") as string)?.trim();
  const synonym = ((formData.get("synonym") as string) || "").trim() || null;
  const example_sentence = ((formData.get("example_sentence") as string) || "").trim() || null;
  const difficulty = ((formData.get("difficulty") as string) || "").trim() || null;

  if (!english || !uzbek) throw new Error("English and Uzbek are required");

  await adminInsert<VocabWord>("vocab_words", {
    category_id: categoryId,
    english,
    uzbek,
    synonym,
    example_sentence,
    difficulty,
  });
  revalidatePath(`/admin/vocabulary/${categoryId}`);
  revalidatePath("/vocabulary");
}

export async function deleteWord(categoryId: string, id: string) {
  await adminDelete("vocab_words", id);
  revalidatePath(`/admin/vocabulary/${categoryId}`);
  revalidatePath("/vocabulary");
}

const MAX_BULK_ROWS = 2000;

export async function bulkImportWords(categoryId: string, rows: BulkWordRow[]) {
  await requireAdmin();

  if (!Array.isArray(rows) || rows.length === 0) throw new Error("No rows to import");
  if (rows.length > MAX_BULK_ROWS) throw new Error(`Too many rows (max ${MAX_BULK_ROWS})`);

  const cleaned = rows
    .map((r) => ({
      category_id: categoryId,
      english: String(r.english ?? "").trim().slice(0, 200),
      uzbek: String(r.uzbek ?? "").trim().slice(0, 200),
      synonym: r.synonym ? String(r.synonym).trim().slice(0, 200) : null,
      example_sentence: r.example_sentence
        ? String(r.example_sentence).trim().slice(0, 500)
        : null,
      difficulty: r.difficulty ? String(r.difficulty).trim().slice(0, 50) : null,
    }))
    .filter((r) => r.english && r.uzbek);

  if (cleaned.length === 0) {
    throw new Error("No valid rows found (English and Uzbek are required in every row)");
  }

  await adminInsertMany("vocab_words", cleaned);
  revalidatePath(`/admin/vocabulary/${categoryId}`);
  revalidatePath("/vocabulary");

  return { imported: cleaned.length, skipped: rows.length - cleaned.length };
}
