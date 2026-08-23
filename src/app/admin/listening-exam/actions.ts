"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { adminInsert, adminUpdate, adminDelete } from "@/lib/admin/crud";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/slugify";
import { isExam } from "@/lib/exam";
import { LISTENING_AUDIO_BUCKET } from "@/lib/listening/storage";
import type { ListeningExamTest, ListeningExamSection } from "@/lib/listening-exam/types";

export async function createUploadUrl(fileName: string) {
  await requireAdmin();
  const admin = createAdminClient();

  const ext = fileName.includes(".") ? fileName.split(".").pop() : "mp3";
  const path = `${randomUUID()}.${ext}`;

  const { data, error } = await admin.storage.from(LISTENING_AUDIO_BUCKET).createSignedUploadUrl(path);
  if (error) throw new Error(error.message);

  return { path, token: data.token };
}

export async function createTest(formData: FormData) {
  const title = (formData.get("title") as string)?.trim();
  const examRaw = (formData.get("exam") as string) || "";
  if (!title) throw new Error("Title is required");
  if (!isExam(examRaw)) throw new Error("A valid exam is required");

  await requireAdmin();
  const admin = createAdminClient();

  const baseSlug = slugify(title) || "test";
  let slug = baseSlug;
  let attempt = 1;
  while (true) {
    const { data } = await admin.from("listening_exam_tests").select("id").eq("slug", slug).maybeSingle();
    if (!data) break;
    attempt += 1;
    slug = `${baseSlug}-${attempt}`;
  }

  await adminInsert<ListeningExamTest>("listening_exam_tests", { title, slug, exam: examRaw });
  revalidatePath("/admin/listening-exam");
  revalidatePath(`/${examRaw}/listening`);
}

export async function deleteTest(id: string) {
  await adminDelete("listening_exam_tests", id);
  revalidatePath("/admin/listening-exam");
}

export async function addSection(testId: string, formData: FormData) {
  const sectionNumber = Number(formData.get("section_number"));
  const label = (formData.get("label") as string)?.trim();
  const audioPath = (formData.get("audio_path") as string)?.trim();
  const transcript = ((formData.get("transcript") as string) || "").trim() || null;

  if (![1, 2, 3, 4].includes(sectionNumber)) throw new Error("Section number must be 1-4");
  if (!label) throw new Error("Label is required");
  if (!audioPath) throw new Error("Audio upload is required");

  await adminInsert<ListeningExamSection>("listening_exam_sections", {
    test_id: testId,
    section_number: sectionNumber,
    label,
    audio_path: audioPath,
    transcript,
  });
  revalidatePath(`/admin/listening-exam/${testId}`);
}

export async function updateSectionTranscript(sectionId: string, testId: string, formData: FormData) {
  const transcript = ((formData.get("transcript") as string) || "").trim() || null;
  await adminUpdate<ListeningExamSection>("listening_exam_sections", sectionId, { transcript });
  revalidatePath(`/admin/listening-exam/${testId}`);
}

export async function deleteSection(sectionId: string, testId: string) {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: section } = await admin
    .from("listening_exam_sections")
    .select("audio_path")
    .eq("id", sectionId)
    .maybeSingle();
  if (section?.audio_path) {
    await admin.storage.from(LISTENING_AUDIO_BUCKET).remove([section.audio_path]);
  }

  await adminDelete("listening_exam_sections", sectionId);
  revalidatePath(`/admin/listening-exam/${testId}`);
}
