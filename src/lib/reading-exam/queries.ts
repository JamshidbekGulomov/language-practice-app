import { createClient } from "@/lib/supabase/server";
import type { Exam } from "@/lib/exam";
import type {
  ReadingExamTest,
  ReadingExamPassage,
  ReadingExamWord,
  ReadingExamAttempt,
} from "@/lib/reading-exam/types";

export async function listTests(exam: Exam): Promise<ReadingExamTest[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reading_exam_tests")
    .select("*")
    .eq("exam", exam)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getTestBySlug(slug: string): Promise<ReadingExamTest | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("reading_exam_tests").select("*").eq("slug", slug).maybeSingle();
  return data;
}

export async function getPassagesForTest(testId: string): Promise<ReadingExamPassage[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reading_exam_passages")
    .select("*")
    .eq("test_id", testId)
    .order("passage_number", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getPassage(testId: string, passageNumber: number): Promise<ReadingExamPassage | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reading_exam_passages")
    .select("*")
    .eq("test_id", testId)
    .eq("passage_number", passageNumber)
    .maybeSingle();
  return data;
}

export async function getWordsForPassage(passageId: string): Promise<ReadingExamWord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reading_exam_words")
    .select("*")
    .eq("passage_id", passageId);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getMyAttempts(userId: string, testId: string): Promise<ReadingExamAttempt[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reading_exam_attempts")
    .select("*")
    .eq("user_id", userId)
    .eq("test_id", testId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}
