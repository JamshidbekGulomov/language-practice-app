"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";

export type MatchingPair = { id: string; left: string; right: string };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Shared click-to-match game for both translation matching (English/Uzbek)
 * and synonym matching (English/English) — the pages differ only in what
 * `pairs` and `onSubmitScore` they pass in.
 */
export function MatchingGame({
  pairs,
  categorySlug,
  onSubmitScore,
}: {
  pairs: MatchingPair[];
  categorySlug: string;
  onSubmitScore: (score: number, total: number) => Promise<void>;
}) {
  const leftItems = useMemo(
    () => shuffle(pairs.map((p) => ({ id: p.id, text: p.left }))),
    [pairs],
  );
  const rightItems = useMemo(
    () => shuffle(pairs.map((p) => ({ id: p.id, text: p.right }))),
    [pairs],
  );

  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [wrong, setWrong] = useState<{ left: string; right: string } | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const total = pairs.length;
  const score = Math.max(0, total - mistakes);

  useEffect(() => {
    if (!done || saved) return;
    startTransition(async () => {
      await onSubmitScore(score, total);
      setSaved(true);
    });
    // Only fire once when the round completes — score/total are fixed by then.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  function handleRightClick(rightId: string) {
    if (!selectedLeft || matched.has(rightId)) return;

    if (selectedLeft === rightId) {
      const next = new Set(matched);
      next.add(rightId);
      setMatched(next);
      setSelectedLeft(null);
      if (next.size === total) setDone(true);
    } else {
      setMistakes((m) => m + 1);
      setWrong({ left: selectedLeft, right: rightId });
      setTimeout(() => setWrong(null), 500);
      setSelectedLeft(null);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-md text-center">
        <p className="text-4xl">🎉</p>
        <h2 className="mt-3 text-2xl font-extrabold text-slate-900">
          {score} / {total}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {mistakes} mistake{mistakes === 1 ? "" : "s"}
        </p>
        <p className="mt-4 text-sm text-slate-400">
          {isPending && !saved ? "Saving…" : saved ? "Score saved!" : ""}
        </p>
        <Link
          href={`/vocabulary/${categorySlug}`}
          className="mt-8 inline-block text-sm text-slate-500 hover:underline"
        >
          ← Back to category
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <p className="mb-4 text-center text-sm text-slate-500">
        Match each pair. Mistakes: {mistakes}
      </p>
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          {leftItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedLeft(item.id)}
              disabled={matched.has(item.id)}
              className={`w-full rounded-lg border px-4 py-3 text-left text-sm font-medium transition ${
                matched.has(item.id)
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : selectedLeft === item.id
                    ? "border-slate-900 bg-slate-900 text-white"
                    : wrong?.left === item.id
                      ? "border-red-300 bg-red-50 text-red-600"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
              }`}
            >
              {item.text}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          {rightItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleRightClick(item.id)}
              disabled={matched.has(item.id) || !selectedLeft}
              className={`w-full rounded-lg border px-4 py-3 text-left text-sm font-medium transition disabled:opacity-50 ${
                matched.has(item.id)
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : wrong?.right === item.id
                    ? "border-red-300 bg-red-50 text-red-600"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
              }`}
            >
              {item.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
