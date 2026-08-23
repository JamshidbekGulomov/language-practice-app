import { createClient } from "@/lib/supabase/server";

export type LeaderboardRow = {
  score: number;
  total: number;
  created_at: string;
  display_name: string | null;
  email: string;
};

type ScoreRow = {
  user_id: string;
  score: number;
  profiles: { display_name: string | null; email: string } | null;
};

export type GlobalLeaderboardRow = {
  user_id: string;
  display_name: string | null;
  email: string;
  diamonds: number;
};

/** One diamond per correct answer, summed across every auto-graded game (Vocabulary/Listening/Reading). */
export async function getGlobalLeaderboard(limit = 20): Promise<GlobalLeaderboardRow[]> {
  const supabase = await createClient();

  const [vocab, listening, reading] = await Promise.all([
    supabase
      .from("vocab_scores")
      .select("user_id, score, profiles(display_name, email)")
      .returns<ScoreRow[]>(),
    supabase
      .from("listening_scores")
      .select("user_id, score, profiles(display_name, email)")
      .returns<ScoreRow[]>(),
    supabase
      .from("reading_scores")
      .select("user_id, score, profiles(display_name, email)")
      .returns<ScoreRow[]>(),
  ]);

  const totals = new Map<string, GlobalLeaderboardRow>();
  for (const { data } of [vocab, listening, reading]) {
    for (const row of data ?? []) {
      const existing = totals.get(row.user_id);
      if (existing) {
        existing.diamonds += row.score;
      } else {
        totals.set(row.user_id, {
          user_id: row.user_id,
          display_name: row.profiles?.display_name ?? null,
          email: row.profiles?.email ?? "",
          diamonds: row.score,
        });
      }
    }
  }

  return Array.from(totals.values())
    .sort((a, b) => b.diamonds - a.diamonds)
    .slice(0, limit);
}
