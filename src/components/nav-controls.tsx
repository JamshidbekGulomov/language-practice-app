"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Home } from "lucide-react";

/** Quick back-one-page + jump-to-home controls, shown on every page next to the logo. */
export function NavControls() {
  const router = useRouter();

  return (
    <div className="flex items-center gap-0.5">
      <button
        type="button"
        onClick={() => router.back()}
        aria-label="Go back"
        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
      </button>
      <Link
        href="/"
        aria-label="Home"
        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
      >
        <Home className="h-4 w-4" />
      </Link>
    </div>
  );
}
