import { createClient } from "@/lib/supabase/server";
import type { TranslationLevel, TranslationSentence, TranslationSubmission } from "@/lib/translation/types";

export async function listLevels(): Promise<TranslationLevel[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("translation_levels")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getLevelBySlug(slug: string): Promise<TranslationLevel | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("translation_levels")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return data;
}

export async function getSentences(levelId: string): Promise<TranslationSentence[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("translation_sentences")
    .select("*")
    .eq("level_id", levelId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Latest submission per sentence for the current user, keyed by sentence_id. */
export async function getMySubmissions(levelId: string): Promise<Map<string, TranslationSubmission>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Map();

  const { data } = await supabase
    .from("translation_submissions")
    .select("*")
    .eq("level_id", levelId)
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  const map = new Map<string, TranslationSubmission>();
  for (const row of data ?? []) map.set(row.sentence_id, row);
  return map;
}
