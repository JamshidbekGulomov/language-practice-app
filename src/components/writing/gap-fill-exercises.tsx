"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { GapFillExercise } from "@/lib/writing/types";

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

export function GapFillExercises({
  exercises,
  onSubmitScore,
}: {
  exercises: GapFillExercise[];
  onSubmitScore: (score: number, total: number) => Promise<void>;
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [isPending, startTransition] = useTransition();

  const total = exercises.length;

  function handleSubmit() {
    const nextResults: Record<string, boolean> = {};
    let score = 0;
    for (const ex of exercises) {
      const correct = normalize(answers[ex.id] ?? "") === normalize(ex.answer);
      nextResults[ex.id] = correct;
      if (correct) score++;
    }
    setResults(nextResults);
    setSubmitted(true);
    startTransition(async () => {
      await onSubmitScore(score, total);
      router.refresh();
    });
  }

  if (total === 0) {
    return <p className="text-sm text-slate-500">No gap-fill exercises yet.</p>;
  }

  return (
    <div className="space-y-3">
      {exercises.map((ex, i) => {
        const blankIndex = ex.prompt.indexOf("___");
        const before = blankIndex === -1 ? ex.prompt : ex.prompt.slice(0, blankIndex);
        const after = blankIndex === -1 ? "" : ex.prompt.slice(blankIndex + 3);
        const isCorrect = results[ex.id];

        return (
          <p key={ex.id} className="text-sm leading-loose text-slate-700">
            <span className="mr-1 text-slate-400">{i + 1}.</span>
            {before}
            <input
              value={answers[ex.id] ?? ""}
              onChange={(e) => setAnswers((a) => ({ ...a, [ex.id]: e.target.value }))}
              disabled={submitted}
              className={`mx-1 w-28 rounded border px-2 py-0.5 text-sm ${
                submitted
                  ? isCorrect
                    ? "border-emerald-300 bg-emerald-50"
                    : "border-red-300 bg-red-50"
                  : "border-slate-300"
              }`}
            />
            {after}
            {submitted && !isCorrect && (
              <span className="ml-1 text-xs text-slate-400">(answer: {ex.answer})</span>
            )}
          </p>
        );
      })}

      {!submitted ? (
        <button
          onClick={handleSubmit}
          className="mt-2 rounded-lg bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white transition hover:from-indigo-500 hover:to-fuchsia-500"
        >
          Check answers
        </button>
      ) : (
        <p className="mt-2 text-sm font-medium text-slate-700">
          {Object.values(results).filter(Boolean).length} / {total} correct
          {isPending ? " — saving…" : ""}
        </p>
      )}
    </div>
  );
}
