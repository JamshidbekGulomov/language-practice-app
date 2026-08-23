"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateUsername, usernameToEmail, looksLikeEmail } from "@/lib/auth/username";

export type AuthActionState = { error: string | null };

export async function signIn(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const identifier = ((formData.get("identifier") as string) || "").trim();
  const password = formData.get("password") as string;

  const email = looksLikeEmail(identifier) ? identifier : usernameToEmail(identifier);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: "Incorrect username/email or password." };

  redirect("/");
}

export async function signUp(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const username = ((formData.get("username") as string) || "").trim();
  const password = formData.get("password") as string;

  const usernameError = validateUsername(username);
  if (usernameError) return { error: usernameError };

  const email = usernameToEmail(username);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    if (error.message.toLowerCase().includes("already registered")) {
      return { error: "That username is already taken. Try another one." };
    }
    return { error: error.message.replace(/email/gi, "username") };
  }

  if (data.user) {
    const admin = createAdminClient();
    await admin.from("profiles").update({ display_name: username }).eq("id", data.user.id);
  }

  redirect("/");
}
