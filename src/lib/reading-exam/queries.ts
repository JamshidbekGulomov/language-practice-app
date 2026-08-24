import { createClient } from "@/lib/supabase/server";
import type { Exam } from "@/lib/exam";
import type {
  ReadingExamTest,
  ReadingExamPassage,
  ReadingExamWord,
  ReadingExamAttempt,
  QuestionGroup,
} from "@/lib/reading-exam/types";
import { questionsInGroup } from "@/lib/reading-exam/types";

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

export async function countTests(exam: Exam): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("reading_exam_tests")
    .select("id", { count: "exact", head: true })
    .eq("exam", exam);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export type ReadingExamTestWithStats = ReadingExamTest & { questionCount: number; passageCount: number };

export async function listTestsWithStats(exam: Exam): Promise<ReadingExamTestWithStats[]> {
  const supabase = await createClient();
  const { data: tests, error } = await supabase
    .from("reading_exam_tests")
    .select("*")
    .eq("exam", exam)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  if (!tests || tests.length === 0) return [];

  const { data: passages } = await supabase
    .from("reading_exam_passages")
    .select("test_id, question_groups")
    .in(
      "test_id",
      tests.map((t) => t.id),
    );

  const stats = new Map<string, { questionCount: number; passageCount: number }>();
  for (const p of passages ?? []) {
    const groups = (p.question_groups ?? []) as QuestionGroup[];
    const questionCount = groups.reduce((sum, g) => sum + questionsInGroup(g).length, 0);
    const cur = stats.get(p.test_id) ?? { questionCount: 0, passageCount: 0 };
    cur.questionCount += questionCount;
    cur.passageCount += 1;
    stats.set(p.test_id, cur);
  }

  return tests.map((t) => ({ ...t, ...(stats.get(t.id) ?? { questionCount: 0, passageCount: 0 }) }));
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
