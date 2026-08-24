import { createClient } from "@/lib/supabase/server";
import type { Exam } from "@/lib/exam";
import type { ListeningExamTest, ListeningExamSection, ListeningExamNote } from "@/lib/listening-exam/types";

export async function listTests(exam: Exam): Promise<ListeningExamTest[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listening_exam_tests")
    .select("*")
    .eq("exam", exam)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function countTests(exam: Exam): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("listening_exam_tests")
    .select("id", { count: "exact", head: true })
    .eq("exam", exam);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function getTestBySlug(slug: string): Promise<ListeningExamTest | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("listening_exam_tests").select("*").eq("slug", slug).maybeSingle();
  return data;
}

export async function getSectionsForTest(testId: string): Promise<ListeningExamSection[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listening_exam_sections")
    .select("*")
    .eq("test_id", testId)
    .order("section_number", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getMyNote(userId: string, testId: string): Promise<ListeningExamNote | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("listening_exam_notes")
    .select("*")
    .eq("user_id", userId)
    .eq("test_id", testId)
    .maybeSingle();
  return data;
}
