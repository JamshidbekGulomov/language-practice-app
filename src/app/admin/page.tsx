import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/supabase/get-profile";

export default async function AdminPage() {
  const profile = await getCurrentProfile();

  if (!profile) redirect("/login");
  if (profile.role !== "admin") redirect("/");

  return (
    <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
        Admin dashboard
      </h1>
      <p className="mt-3 text-slate-500">
        Signed in as {profile.email}. Content management tools (vocab,
        audio, passages, videos, topics, translations) land in Phase 1.
      </p>
    </div>
  );
}
