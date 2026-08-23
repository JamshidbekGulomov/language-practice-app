"use server";

import { createClient } from "@/lib/supabase/server";

export async function submitAttempt(input: {
  test_id: string;
  scope: "passage" | "full";
  passage_number: number | null;
  score: number;
  total: number;
  answers: Record<string, string>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be logged in to save a result");

  const { error } = await supabase.from("reading_exam_attempts").insert({
    user_id: user.id,
    ...input,
  });
  if (error) throw new Error(error.message);
}
