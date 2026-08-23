"use client";

import { useEffect, useState } from "react";
import type { GradeResult } from "@/lib/reading-exam/grading";

const CIRC = 2 * Math.PI * 40;

function Confetti() {
  const [pieces] = useState(() =>
    Array.from({ length: 40 }, (_, i) => ({
      left: Math.random() * 100,
      delay: Math.random() * 0.4,
      duration: 2.2 + Math.random() * 1.4,
      color: ["#f43f5e", "#f59e0b", "#22c55e", "#6366f1", "#06b6d4"][i % 5],
    })),
  );
  return (
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
      {pieces.map((p, i) => (
        <span
          key={i}
          style={{
            position: "fixed",
            top: -20,
            left: `${p.left}%`,
            width: 8,
            height: 14,
            background: p.color,
            borderRadius: 2,
            animation: `reading-confetti-fall ${p.duration}s linear ${p.delay}s forwards`,
          }}
        />
      ))}
      <style>{`@keyframes reading-confetti-fall{to{transform:translateY(110vh) rotate(720deg);opacity:.35}}`}</style>
    </div>
  );
}

export function ResultsModal({
  result,
  onRetake,
  onClose,
}: {
  result: GradeResult;
  onRetake: () => void;
  onClose: () => void;
}) {
  const [ringOffset, setRingOffset] = useState(CIRC);
  const pct = result.total > 0 ? result.score / result.total : 0;
  const showConfetti = pct >= 0.85;

  useEffect(() => {
    const t = setTimeout(() => setRingOffset(CIRC - pct * CIRC), 120);
    return () => clearTimeout(t);
  }, [pct]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {showConfetti && <Confetti />}
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="relative overflow-hidden bg-gradient-to-br from-rose-500 via-red-600 to-red-900 p-6 text-white">
          <button onClick={onClose} className="absolute right-4 top-3 text-2xl leading-none text-white/80 hover:text-white">
            ×
          </button>
          <div className="flex items-center gap-5">
            <div className="relative h-24 w-24 shrink-0">
              <svg width="96" height="96" className="-rotate-90">
                <circle cx="48" cy="48" r="40" fill="none" stroke="rgba(255,255,255,.22)" strokeWidth="8" />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={CIRC}
                  strokeDashoffset={ringOffset}
                  style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(.4,0,.2,1)" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-extrabold leading-none">{result.score}</span>
                <span className="text-[10px] opacity-85">of {result.total}</span>
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="mb-1.5 text-xs font-bold uppercase tracking-wide opacity-85">Your Result</p>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/20 px-3 py-1 text-sm font-extrabold">
                {Math.round(pct * 100)}% correct
              </span>
            </div>
          </div>
        </div>

        <div className="overflow-y-auto px-6 py-4">
          {Object.entries(result.groupScores).length > 1 && (
            <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">By question type</p>
              <div className="flex flex-wrap gap-2">
                {Object.values(result.groupScores).map((g, i) => {
                  const ok = g.total > 0 && g.score / g.total >= 0.7;
                  return (
                    <span
                      key={i}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                        ok ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-red-300 bg-red-50 text-red-700"
                      }`}
                    >
                      {g.label}: {g.score}/{g.total}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-[48px_1fr_1fr_44px] gap-2 rounded-t-lg bg-slate-50 px-2 py-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
            <div>#</div>
            <div>Your Answer</div>
            <div>Correct Answer</div>
            <div>✓/✗</div>
          </div>
          <div className="divide-y divide-slate-100">
            {result.perQuestion.map((q) => (
              <div
                key={q.question}
                className={`grid grid-cols-[48px_1fr_1fr_44px] items-center gap-2 px-2 py-2 text-sm ${
                  q.correct ? "bg-emerald-50/60" : "bg-red-50/60"
                }`}
              >
                <div className="font-bold text-slate-700">{q.question}</div>
                <div className="truncate rounded bg-slate-100 px-2 py-1 text-xs">{q.given || "—"}</div>
                <div className="truncate rounded bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800">
                  {q.correctAnswer}
                </div>
                <div className="text-center">
                  {q.correct ? (
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white">✓</span>
                  ) : (
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">✗</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 border-t border-slate-200 p-4">
          <button
            onClick={onRetake}
            className="flex-1 rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100"
          >
            🔄 Retake
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100"
          >
            ↩ Return to test
          </button>
        </div>
      </div>
    </div>
  );
}
