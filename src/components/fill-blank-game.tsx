"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { TranscriptToken } from "@/lib/fill-blank";

export function FillBlankGame({
  tokens,
  backHref,
  onSubmitScore,
}: {
  tokens: TranscriptToken[];
  backHref: string;
  onSubmitScore: (score: number, total: number) => Promise<void>;
}) {
  const blanks = tokens.filter((t) => t.type === "blank");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [score, setScore] = useState(0);

  const total = blanks.length;

  function handleSubmit() {
    const correct = blanks.filter(
      (b) => (answers[b.id] ?? "").trim().toLowerCase() === b.answer.toLowerCase(),
    ).length;
    setScore(correct);
    setSubmitted(true);
    startTransition(async () => {
      await onSubmitScore(correct, total);
      setSaved(true);
    });
  }

  if (total === 0) {
    return <p className="text-center text-slate-500">No vocab words found in this transcript.</p>;
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-md text-center">
        <p className="text-4xl">📝</p>
        <h2 className="mt-3 text-2xl font-extrabold text-slate-900">
          {score} / {total}
        </h2>
        <p className="mt-4 text-sm text-slate-400">
          {isPending && !saved ? "Saving…" : saved ? "Score saved!" : ""}
        </p>
        <Link href={backHref} className="mt-8 inline-block text-sm text-slate-500 hover:underline">
          ← Back to clip
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <p className="leading-loose text-slate-700">
        {tokens.map((t, i) =>
          t.type === "text" ? (
            <span key={i}>{t.value}</span>
          ) : (
            <input
              key={t.id}
              value={answers[t.id] ?? ""}
              onChange={(e) => setAnswers((a) => ({ ...a, [t.id]: e.target.value }))}
              className="mx-1 w-28 rounded border border-slate-300 px-2 py-0.5 text-sm"
            />
          ),
        )}
      </p>
      <button
        onClick={handleSubmit}
        className="mt-6 rounded-lg bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white transition hover:from-indigo-500 hover:to-fuchsia-500"
      >
        Submit answers
      </button>
    </div>
  );
}
