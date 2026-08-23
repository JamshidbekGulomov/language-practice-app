import Link from "next/link";
import { Send, ShieldCheck } from "lucide-react";
import { getCurrentProfile } from "@/lib/supabase/get-profile";
import { siteConfig } from "@/lib/site-config";
import { SignOutButton } from "@/components/sign-out-button";

export async function Header() {
  const profile = await getCurrentProfile();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="text-lg font-extrabold tracking-tight text-slate-900">
          {siteConfig.name}
        </Link>

        <div className="flex items-center gap-4">
          <a
            href={siteConfig.telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-1.5 text-sm font-medium text-sky-600 hover:text-sky-700 sm:flex"
          >
            <Send className="h-4 w-4" />
            Telegram
          </a>

          {profile?.role === "admin" && (
            <Link
              href="/admin"
              className="hidden items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 sm:flex"
            >
              <ShieldCheck className="h-4 w-4" />
              Admin
            </Link>
          )}

          {profile ? (
            <div className="flex items-center gap-3">
              <span className="hidden text-sm text-slate-500 sm:inline">
                {profile.display_name ?? profile.email}
              </span>
              <SignOutButton />
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-slate-900 px-4 py-1.5 text-sm font-semibold text-white hover:bg-slate-700"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
