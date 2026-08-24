"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp } from "lucide-react";

export function PracticeSinglePassages({
  testSlug,
  passages,
}: {
  testSlug: string;
  passages: { passage_number: number; title: string; questionCount: number }[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
      >
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        {open ? "Hide Passages" : "Practice Single Passages"}
      </button>

      {open && (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {passages.map((p) => (
            <div key={p.passage_number} className="rounded-xl border border-slate-200 bg-white p-4">
              <span className="inline-block rounded-full border border-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-500">
                Passage {p.passage_number}
              </span>
              <h3 className="mt-2 font-bold text-slate-900">{p.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{p.questionCount} questions</p>
              <Link
                href={`/reading-exam/${testSlug}/passage/${p.passage_number}`}
                className="mt-3 block rounded-lg bg-emerald-600 py-2 text-center text-sm font-bold text-white hover:bg-emerald-500"
              >
                Start
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
