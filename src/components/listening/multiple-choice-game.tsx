"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import type { MCQuestion } from "@/lib/listening/build-mc-questions";

export function MultipleChoiceGame({
  questions,
  backHref,
  onSubmitScore,
}: {
  questions: MCQuestion[];
  backHref: string;
  onSubmitScore: (score: number, total: number) => Promise<void>;
}) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const total = questions.length;
  const q = questions[index];

  useEffect(() => {
    if (!done || saved) return;
    startTransition(async () => {
      await onSubmitScore(correctCount, total);
      setSaved(true);
    });
    // Only fire once when the round completes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  function choose(option: string) {
    if (selected) return;
    setSelected(option);
    const isCorrect = option === q.correct;
    setTimeout(() => {
      if (isCorrect) setCorrectCount((c) => c + 1);
      if (index + 1 >= total) {
        setDone(true);
      } else {
        setIndex((i) => i + 1);
        setSelected(null);
      }
    }, 500);
  }

  if (total === 0) {
    return <p className="text-center text-slate-500">Not enough vocab yet for this game.</p>;
  }

  if (done) {
    return (
      <div className="mx-auto max-w-md text-center">
        <p className="text-4xl">✅</p>
        <h2 className="mt-3 text-2xl font-extrabold text-slate-900">
          {correctCount} / {total}
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
    <div className="mx-auto max-w-md text-center">
      <p className="text-sm text-slate-400">
        {index + 1} / {total}
      </p>
      <h2 className="mt-3 text-2xl font-bold text-slate-900">{q.word}</h2>
      <div className="mt-6 space-y-2">
        {q.options.map((opt) => {
          const isSelected = selected === opt;
          const isCorrectOpt = opt === q.correct;
          const showState = selected != null;
          return (
            <button
              key={opt}
              onClick={() => choose(opt)}
              disabled={selected != null}
              className={`w-full rounded-lg border px-4 py-3 text-sm font-medium transition ${
                showState && isCorrectOpt
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                  : showState && isSelected
                    ? "border-red-300 bg-red-50 text-red-600"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
