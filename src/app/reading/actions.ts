"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ReadingGameMode } from "@/lib/reading/types";

export async function submitScore(
  passageId: string,
  passageSlug: string,
  mode: ReadingGameMode,
  score: number,
  total: number,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be logged in to save a score");

  const { error } = await supabase.from("reading_scores").insert({
    user_id: user.id,
    passage_id: passageId,
    game_mode: mode,
    score,
    total,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/reading/${passageSlug}`);
}
