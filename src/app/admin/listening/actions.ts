"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { adminInsert, adminInsertMany, adminUpdate, adminDelete } from "@/lib/admin/crud";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/slugify";
import { LISTENING_AUDIO_BUCKET } from "@/lib/listening/storage";
import type { ListeningClip, ListeningWord } from "@/lib/listening/types";

/**
 * Vercel Serverless Functions cap request bodies at 4.5MB, so audio files
 * can't go through a Server Action directly. Instead the browser uploads
 * straight to Supabase Storage using a short-lived signed URL, and only
 * the resulting storage path is sent to the server.
 */
export async function createUploadUrl(fileName: string) {
  await requireAdmin();
  const admin = createAdminClient();

  const ext = fileName.includes(".") ? fileName.split(".").pop() : "mp3";
  const path = `${randomUUID()}.${ext}`;

  const { data, error } = await admin.storage.from(LISTENING_AUDIO_BUCKET).createSignedUploadUrl(path);
  if (error) throw new Error(error.message);

  return { path, token: data.token };
}

export async function createClip(formData: FormData) {
  const title = (formData.get("title") as string)?.trim();
  const audioPath = (formData.get("audio_path") as string)?.trim();
  const transcript = ((formData.get("transcript") as string) || "").trim() || null;

  if (!title) throw new Error("Title is required");
  if (!audioPath) throw new Error("Audio upload is required");

  await requireAdmin();
  const admin = createAdminClient();

  const baseSlug = slugify(title) || "clip";
  let slug = baseSlug;
  let attempt = 1;
  while (true) {
    const { data } = await admin
      .from("listening_clips")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!data) break;
    attempt += 1;
    slug = `${baseSlug}-${attempt}`;
  }

  await adminInsert<ListeningClip>("listening_clips", {
    title,
    slug,
    audio_path: audioPath,
    transcript,
  });
  revalidatePath("/admin/listening");
  revalidatePath("/listening");
}

export async function deleteClip(id: string) {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: clip } = await admin
    .from("listening_clips")
    .select("audio_path")
    .eq("id", id)
    .maybeSingle();
  if (clip?.audio_path) {
    await admin.storage.from(LISTENING_AUDIO_BUCKET).remove([clip.audio_path]);
  }

  await adminDelete("listening_clips", id);
  revalidatePath("/admin/listening");
  revalidatePath("/listening");
}

export async function updateTranscript(clipId: string, formData: FormData) {
  const transcript = ((formData.get("transcript") as string) || "").trim() || null;
  await adminUpdate<ListeningClip>("listening_clips", clipId, { transcript });
  revalidatePath(`/admin/listening/${clipId}`);
  revalidatePath("/listening");
}

export async function addWord(clipId: string, formData: FormData) {
  const word = (formData.get("word") as string)?.trim();
  const meaning = ((formData.get("meaning") as string) || "").trim() || null;
  if (!word) throw new Error("Word is required");

  await adminInsert<ListeningWord>("listening_words", { clip_id: clipId, word, meaning });
  revalidatePath(`/admin/listening/${clipId}`);
  revalidatePath("/listening");
}

export async function deleteWord(clipId: string, id: string) {
  await adminDelete("listening_words", id);
  revalidatePath(`/admin/listening/${clipId}`);
  revalidatePath("/listening");
}

export type BulkListeningWordRow = { word: string; meaning?: string | null };

export async function bulkImportWords(clipId: string, rows: BulkListeningWordRow[]) {
  await requireAdmin();

  if (!Array.isArray(rows) || rows.length === 0) throw new Error("No rows to import");

  const cleaned = rows
    .map((r) => ({
      clip_id: clipId,
      word: String(r.word ?? "").trim().slice(0, 200),
      meaning: r.meaning ? String(r.meaning).trim().slice(0, 300) : null,
    }))
    .filter((r) => r.word);

  if (cleaned.length === 0) throw new Error("No valid rows found (Word is required in every row)");

  await adminInsertMany("listening_words", cleaned);
  revalidatePath(`/admin/listening/${clipId}`);
  revalidatePath("/listening");

  return { imported: cleaned.length, skipped: rows.length - cleaned.length };
}
