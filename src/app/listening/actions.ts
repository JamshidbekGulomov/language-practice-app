"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ListeningGameMode } from "@/lib/listening/types";

export async function submitScore(
  clipId: string,
  clipSlug: string,
  mode: ListeningGameMode,
  score: number,
  total: number,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be logged in to save a score");

  const { error } = await supabase.from("listening_scores").insert({
    user_id: user.id,
    clip_id: clipId,
    game_mode: mode,
    score,
    total,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/listening/${clipSlug}`);
}
