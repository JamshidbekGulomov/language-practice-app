import { createClient } from "@/lib/supabase/server";
import type {
  ListeningClip,
  ListeningWord,
  ListeningGameMode,
} from "@/lib/listening/types";
import type { LeaderboardRow } from "@/lib/leaderboard";

export async function listClips(): Promise<(ListeningClip & { wordCount: number })[]> {
  const supabase = await createClient();
  const { data: clips, error } = await supabase
    .from("listening_clips")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  const { data: words } = await supabase.from("listening_words").select("clip_id");
  const counts = new Map<string, number>();
  for (const w of words ?? []) counts.set(w.clip_id, (counts.get(w.clip_id) ?? 0) + 1);

  return (clips ?? []).map((c) => ({ ...c, wordCount: counts.get(c.id) ?? 0 }));
}

export async function getClipBySlug(slug: string): Promise<ListeningClip | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("listening_clips")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return data;
}

export async function getWordsForClip(clipId: string): Promise<ListeningWord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listening_words")
    .select("*")
    .eq("clip_id", clipId);
  if (error) throw new Error(error.message);
  return data ?? [];
}

type LeaderboardQueryRow = {
  score: number;
  total: number;
  created_at: string;
  profiles: { display_name: string | null; email: string } | null;
};

export async function getListeningLeaderboard(
  clipId: string,
  mode: ListeningGameMode,
): Promise<LeaderboardRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listening_scores")
    .select("score, total, created_at, profiles(display_name, email)")
    .eq("clip_id", clipId)
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
