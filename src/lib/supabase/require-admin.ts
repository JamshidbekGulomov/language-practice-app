import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/supabase/get-profile";
import type { Profile } from "@/lib/types/profile";

/**
 * Re-verifies the admin role server-side. Call this at the top of every
 * admin page/layout AND every admin Server Action — route gating alone
 * is not a security boundary, since actions are reachable directly.
 */
export async function requireAdmin(): Promise<Profile> {
  const profile = await getCurrentProfile();

  if (!profile) redirect("/login");
  if (profile.role !== "admin") redirect("/");

  return profile;
}
