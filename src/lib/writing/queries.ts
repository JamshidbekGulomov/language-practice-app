import { createClient } from "@/lib/supabase/server";
import type {
  WritingLesson,
  GapFillExercise,
  SentencePrompt,
  GapFillResult,
  SentenceSubmission,
} from "@/lib/writing/types";

export async function listLessons(): Promise<WritingLesson[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("writing_lessons")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getLessonBySlug(slug: string): Promise<WritingLesson | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("writing_lessons")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return data;
}

export async function getGapFillExercises(lessonId: string): Promise<GapFillExercise[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("writing_gap_fill_exercises")
    .select("*")
    .eq("lesson_id", lessonId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getSentencePrompts(lessonId: string): Promise<SentencePrompt[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("writing_sentence_prompts")
    .select("*")
    .eq("lesson_id", lessonId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Whether the current user has completed the gap-fill set — gates sentence construction. */
export async function hasCompletedGapFill(lessonId: string): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("writing_gap_fill_results")
    .select("id")
    .eq("lesson_id", lessonId)
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  return !!data;
}

export async function getMyGapFillResult(lessonId: string): Promise<GapFillResult | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("writing_gap_fill_results")
    .select("*")
    .eq("lesson_id", lessonId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

/** Latest submission per prompt for the current user, keyed by prompt_id. */
export async function getMySubmissions(
  lessonId: string,
): Promise<Map<string, SentenceSubmission>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Map();

  const { data } = await supabase
    .from("writing_sentence_submissions")
    .select("*")
    .eq("lesson_id", lessonId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  const map = new Map<string, SentenceSubmission>();
  for (const row of data ?? []) map.set(row.prompt_id, row);
  return map;
}
