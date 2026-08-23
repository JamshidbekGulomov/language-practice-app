"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const supabase = createClient();

  return (
    <button
      onClick={async () => {
        await supabase.auth.signOut();
        router.refresh();
      }}
      className="text-sm font-medium text-slate-600 hover:text-slate-900"
    >
      Sign out
    </button>
  );
}
