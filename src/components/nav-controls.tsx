"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Home } from "lucide-react";

/** Top-left corner control: back one page in browser history. */
export function BackButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      aria-label="Go back"
      className="inline-flex h-11 w-11 items-center justify-center rounded-full border-2 border-red-500 bg-white text-red-600 shadow-sm transition hover:bg-red-50"
    >
      <ArrowLeft className="h-5 w-5" />
    </button>
  );
}

/** Top-right corner control: jump straight to the homepage. */
export function HomeButton() {
  return (
    <Link
      href="/"
      aria-label="Home"
      className="inline-flex items-center gap-2 rounded-xl border-2 border-red-500 bg-white px-3 py-2 text-red-600 shadow-sm transition hover:bg-red-50"
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-md border-2 border-red-500 bg-white">
        <Home className="h-4 w-4" />
      </span>
      <span className="text-base font-bold">Home</span>
    </Link>
  );
}
