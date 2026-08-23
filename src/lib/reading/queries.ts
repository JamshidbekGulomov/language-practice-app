import { createClient } from "@/lib/supabase/server";
import type { ReadingPassage, ReadingWord, ReadingGameMode } from "@/lib/reading/types";
import type { LeaderboardRow } from "@/lib/leaderboard";

export async function listPassages(): Promise<(ReadingPassage & { wordCount: number })[]> {
  const supabase = await createClient();
  const { data: passages, error } = await supabase
    .from("reading_passages")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  const { data: words } = await supabase.from("reading_words").select("passage_id");
  const counts = new Map<string, number>();
  for (const w of words ?? []) counts.set(w.passage_id, (counts.get(w.passage_id) ?? 0) + 1);

  return (passages ?? []).map((p) => ({ ...p, wordCount: counts.get(p.id) ?? 0 }));
}

export async function getPassageBySlug(slug: string): Promise<ReadingPassage | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reading_passages")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return data;
}

export async function getWordsForPassage(passageId: string): Promise<ReadingWord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reading_words")
    .select("*")
    .eq("passage_id", passageId);
  if (error) throw new Error(error.message);
  return data ?? [];
}

type LeaderboardQueryRow = {
  score: number;
  total: number;
  created_at: string;
  profiles: { display_name: string | null; email: string } | null;
};

export async function getReadingLeaderboard(
  passageId: string,
  mode: ReadingGameMode,
): Promise<LeaderboardRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reading_scores")
    .select("score, total, created_at, profiles(display_name, email)")
    .eq("passage_id", passageId)
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
