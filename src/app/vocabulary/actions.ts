"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { VocabGameMode } from "@/lib/vocabulary/types";

export async function submitScore(
  categoryId: string,
  categorySlug: string,
  mode: VocabGameMode,
  score: number,
  total: number,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be logged in to save a score");

  const { error } = await supabase.from("vocab_scores").insert({
    user_id: user.id,
    category_id: categoryId,
    game_mode: mode,
    score,
    total,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/vocabulary/${categorySlug}`);
}
