import { createClient } from "@/lib/supabase/server";
import type {
  VocabCategory,
  VocabWord,
  VocabGameMode,
  LeaderboardRow,
} from "@/lib/vocabulary/types";

export async function listCategories(): Promise<
  (VocabCategory & { wordCount: number })[]
> {
  const supabase = await createClient();
  const { data: categories, error } = await supabase
    .from("vocab_categories")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  const { data: words } = await supabase.from("vocab_words").select("category_id");
  const counts = new Map<string, number>();
  for (const w of words ?? []) {
    counts.set(w.category_id, (counts.get(w.category_id) ?? 0) + 1);
  }

  return (categories ?? []).map((c) => ({ ...c, wordCount: counts.get(c.id) ?? 0 }));
}

export async function getCategoryBySlug(slug: string): Promise<VocabCategory | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("vocab_categories")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return data;
}

export async function getWordsForCategory(categoryId: string): Promise<VocabWord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vocab_words")
    .select("*")
    .eq("category_id", categoryId);
  if (error) throw new Error(error.message);
  return data ?? [];
}

type LeaderboardQueryRow = {
  score: number;
  total: number;
  created_at: string;
  profiles: { display_name: string | null; email: string } | null;
};

export async function getLeaderboard(
  categoryId: string,
  mode: VocabGameMode,
): Promise<LeaderboardRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vocab_scores")
    .select("score, total, created_at, profiles(display_name, email)")
    .eq("category_id", categoryId)
    .eq("game_mode", mode)
    .order("score", { ascending: false })
    .limit(10)
    .returns<LeaderboardQueryRow[]>();
  if (error) throw new Error(error.message);

  return (data ?? []).map((r) => ({
    score: r.score,
    total: r.total,
    created_at: r.created_at,
    display_name: r.profiles?.display_name ?? null,
    email: r.profiles?.email ?? "",
  }));
}
