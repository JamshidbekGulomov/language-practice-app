"use client";

import { useState } from "react";
import Link from "next/link";
import type { VocabWord } from "@/lib/vocabulary/types";

export function FlashcardsGame({
  words,
  categorySlug,
}: {
  words: VocabWord[];
  categorySlug: string;
}) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (words.length === 0) {
    return <p className="text-center text-slate-500">No words in this category yet.</p>;
  }

  const word = words[index];

  return (
    <div className="mx-auto max-w-md text-center">
      <button
        onClick={() => setFlipped((f) => !f)}
        className="mx-auto flex h-56 w-full items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 text-2xl font-bold text-slate-900 shadow-sm transition hover:shadow-md"
      >
        {flipped ? word.uzbek : word.english}
      </button>
      <p className="mt-3 text-xs text-slate-400">{flipped ? "Uzbek" : "English"} — tap to flip</p>

      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={() => {
            setFlipped(false);
            setIndex((i) => Math.max(0, i - 1));
          }}
          disabled={index === 0}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 disabled:opacity-40"
        >
          Previous
        </button>
        <span className="text-sm text-slate-400">
          {index + 1} / {words.length}
        </span>
        <button
          onClick={() => {
            setFlipped(false);
            setIndex((i) => Math.min(words.length - 1, i + 1));
          }}
          disabled={index === words.length - 1}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 disabled:opacity-40"
        >
          Next
        </button>
      </div>

      <Link
        href={`/vocabulary/${categorySlug}`}
        className="mt-8 inline-block text-sm text-slate-500 hover:underline"
      >
        ← Back to category
      </Link>
    </div>
  );
}
