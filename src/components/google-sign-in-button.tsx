"use client";

import { createClient } from "@/lib/supabase/client";

export function GoogleSignInButton() {
  const supabase = createClient();

  return (
    <button
      type="button"
      onClick={() =>
        supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo: `${window.location.origin}/auth/callback` },
        })
      }
      className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
    >
      <svg className="h-4 w-4" viewBox="0 0 48 48" aria-hidden="true">
        <path
          fill="#FFC107"
          d="M43.6 20.5H42V20.5H24v7h11.3c-1.6 4.5-5.9 7.7-11.3 7.7-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5-5C33.6 6 29.1 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z"
        />
        <path
          fill="#FF3D00"
          d="M6.3 14.7l6.6 4.8C14.6 15.6 19 12.7 24 12.7c3.1 0 5.9 1.2 8 3.1l5-5C33.6 6.9 29.1 5 24 5c-7.4 0-13.7 4.2-16.9 10.3z"
        />
        <path
          fill="#4CAF50"
          d="M24 44c5.1 0 9.6-1.9 12.9-5.1l-6-5.1c-1.9 1.4-4.3 2.2-6.9 2.2-5.3 0-9.8-3.6-11.4-8.4l-6.5 5C8.2 39.7 15.5 44 24 44z"
        />
        <path
          fill="#1976D2"
          d="M43.6 20.5H42V20.5H24v7h11.3c-.8 2.2-2.2 4.1-4.1 5.4l6 5.1C40.4 35.1 44 30 44 24c0-1.2-.1-2.4-.4-3.5z"
        />
      </svg>
      Continue with Google
    </button>
  );
}
