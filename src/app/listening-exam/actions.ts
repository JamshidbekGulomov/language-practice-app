"use server";

import { createClient } from "@/lib/supabase/server";

export async function saveNote(testId: string, content: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be logged in to save notes");

  const { error } = await supabase
    .from("listening_exam_notes")
    .upsert({ user_id: user.id, test_id: testId, content, updated_at: new Date().toISOString() }, { onConflict: "user_id,test_id" });
  if (error) throw new Error(error.message);
}
