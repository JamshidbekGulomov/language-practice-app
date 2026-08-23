"use client";

import { useState } from "react";
import Link from "next/link";
import type { ReadingExamPassage } from "@/lib/reading-exam/types";
import { normalize } from "@/lib/reading-exam/grading";

export function SynonymPractice({
  passage,
  backHref,
}: {
  passage: ReadingExamPassage;
  backHref: string;
}) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [checked, setChecked] = useState(false);

  const pairs = passage.paraphrase_pairs;
  const score = pairs.filter((p, i) => normalize(answers[i] ?? "") === normalize(p.phrase)).length;

  if (pairs.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-slate-500">No synonym practice has been added for this passage yet.</p>
        <Link href={backHref} className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:underline">
          &larr; Back to passage
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-16 sm:px-6 lg:grid-cols-2">
      <div>
        <h1 className="mb-2 text-2xl font-extrabold tracking-tight text-slate-900">{passage.title}</h1>
        <p className="mb-4 text-sm text-slate-500">Read the passage, then find each paraphrase on the right.</p>
        <div className="max-h-[70vh] overflow-y-auto rounded-xl border border-slate-200 bg-white p-5">
          {passage.paragraphs.map((p) => (
            <p key={p.letter} className="mb-4 text-justify leading-relaxed text-slate-700">
              <span className="mr-1.5 font-extrabold text-red-600">{p.letter}</span>
              {p.text}
            </p>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-lg font-bold text-slate-900">🔎 Synonym / Paraphrase Practice</h2>
        <p className="mb-4 text-sm text-slate-500">
          For each key word or phrase below, type the word or phrase used in the passage that means the same thing.
        </p>

        <div className="space-y-3">
          {pairs.map((pair, i) => {
            const ok = checked && normalize(answers[i] ?? "") === normalize(pair.phrase);
            const bad = checked && !ok;
            return (
              <div key={i} className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="mb-2 text-sm font-semibold text-slate-800">&ldquo;{pair.keyword}&rdquo;</p>
                <input
                  value={answers[i] ?? ""}
                  disabled={checked}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [i]: e.target.value }))}
                  placeholder="Type the matching word/phrase from the passage"
                  className={`w-full rounded-lg border px-3 py-2 text-sm ${
                    ok ? "border-emerald-500 bg-emerald-50" : bad ? "border-red-500 bg-red-50" : "border-slate-300"
                  }`}
                />
                {bad && <p className="mt-1.5 text-xs font-medium text-emerald-700">Answer: {pair.phrase}</p>}
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex items-center gap-4">
          {!checked ? (
            <button
              onClick={() => setChecked(true)}
              className="rounded-lg bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-5 py-2.5 text-sm font-semibold text-white hover:from-indigo-500 hover:to-fuchsia-500"
            >
              Check Answers
            </button>
          ) : (
            <>
              <span className="text-sm font-bold text-slate-700">
                {score} of {pairs.length} correct
              </span>
              <button
                onClick={() => {
                  setAnswers({});
                  setChecked(false);
                }}
                className="text-sm font-medium text-indigo-600 hover:underline"
              >
                Try again
              </button>
            </>
          )}
          <Link href={backHref} className="text-sm font-medium text-slate-500 hover:underline">
            &larr; Back to passage
          </Link>
        </div>
      </div>
    </div>
  );
}
