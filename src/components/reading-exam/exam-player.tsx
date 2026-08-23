"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { ReadingExamPassage, MatchingHeadingsGroup, MatchingFeaturesGroup, SummaryCompletionGroup } from "@/lib/reading-exam/types";
import { questionsInGroup } from "@/lib/reading-exam/types";
import { gradePassage, type GradeResult } from "@/lib/reading-exam/grading";
import { splitOnGlossary } from "@/lib/reading-exam/render-glossary";
import { submitAttempt } from "@/app/reading-exam/actions";
import { ResultsModal } from "@/components/reading-exam/results-modal";

type Theme = "light" | "dark" | "night";
type Mode = "exam" | "casual";

const THEME_CLASSES: Record<Theme, { bg: string; panel: string; border: string; text: string; subtext: string; tint: string }> = {
  light: { bg: "bg-white", panel: "bg-white", border: "border-slate-200", text: "text-slate-900", subtext: "text-slate-500", tint: "bg-slate-50" },
  dark: { bg: "bg-slate-950", panel: "bg-slate-900", border: "border-slate-700", text: "text-slate-100", subtext: "text-slate-400", tint: "bg-slate-800" },
  night: { bg: "bg-[#1a1410]", panel: "bg-[#211a14]", border: "border-[#3a2f24]", text: "text-[#e3d2b8]", subtext: "text-[#a8927a]", tint: "bg-[#2b2218]" },
};

function fmt(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export function ExamPlayer({
  testId,
  testTitle,
  scopeLabel,
  scope,
  passageNumber,
  passages,
  backHref,
  wordsHref,
  synonymsHref,
}: {
  testId: string;
  testTitle: string;
  scopeLabel: string;
  scope: "passage" | "full";
  passageNumber: number | null;
  passages: ReadingExamPassage[];
  backHref: string;
  wordsHref?: string;
  synonymsHref?: string;
}) {
  const [theme, setTheme] = useState<Theme>("light");
  const [fontScale, setFontScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [leftWidthPct, setLeftWidthPct] = useState(50);
  const [activeIdx, setActiveIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [armedCode, setArmedCode] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [gradeResult, setGradeResult] = useState<GradeResult | null>(null);
  const [glossaryPopup, setGlossaryPopup] = useState<{ x: number; y: number; term: { word: string; def: string; syn: string; uz: string } } | null>(null);
  const [showGlossaryList, setShowGlossaryList] = useState(false);
  const [curQuestion, setCurQuestion] = useState<number | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [started, setStarted] = useState(false);
  const [mode, setMode] = useState<Mode>("exam");
  const defaultSeconds = scope === "full" ? 3600 : 1200;
  const [secondsLeft, setSecondsLeft] = useState(defaultSeconds);
  const [elapsed, setElapsed] = useState(0);

  const dragRef = useRef<HTMLDivElement>(null);

  const t = THEME_CLASSES[theme];
  const passage = passages[activeIdx];

  const allQuestions = useMemo(
    () => passages.flatMap((p) => p.question_groups.flatMap((g) => questionsInGroup(g))),
    [passages],
  );

  useEffect(() => {
    if (!started || checked) return;
    const interval = setInterval(() => {
      if (mode === "casual") {
        setElapsed((e) => e + 1);
        return;
      }
      setSecondsLeft((s) => {
        if (s <= 1) {
          doCheck();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, checked, mode]);

  useEffect(() => {
    function onFsChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  function toggleFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
    else document.exitFullscreen?.().catch(() => {});
  }

  function cycleTheme() {
    setTheme((cur) => (cur === "light" ? "dark" : cur === "dark" ? "night" : "light"));
  }

  function startDrag(e: React.MouseEvent) {
    e.preventDefault();
    function onMove(ev: MouseEvent) {
      const total = window.innerWidth;
      const pct = Math.max(25, Math.min(75, (ev.clientX / total) * 100));
      setLeftWidthPct(pct);
    }
    function onUp() {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  function placeHeading(group: MatchingHeadingsGroup, letter: string, code: string) {
    if (checked) return;
    const item = group.items.find((i) => i.paragraphLetter === letter);
    if (!item) return;
    setAnswers((prev) => {
      const next = { ...prev };
      for (const it of group.items) {
        if (next[it.question] === code && it.question !== item.question) delete next[it.question];
      }
      next[item.question] = code;
      return next;
    });
    setArmedCode(null);
  }

  function clearHeadingSlot(group: MatchingHeadingsGroup, letter: string) {
    if (checked) return;
    const item = group.items.find((i) => i.paragraphLetter === letter);
    if (!item) return;
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[item.question];
      return next;
    });
  }

  async function doCheck() {
    setChecked(true);
    const results = passages.map((p) => gradePassage(p, Object.fromEntries(Object.entries(answers).map(([k, v]) => [k, v]))));
    const merged: GradeResult = {
      score: results.reduce((s, r) => s + r.score, 0),
      total: results.reduce((s, r) => s + r.total, 0),
      perQuestion: results.flatMap((r) => r.perQuestion),
      groupScores: Object.assign({}, ...results.map((r, i) => Object.fromEntries(Object.entries(r.groupScores).map(([k, v]) => [`${i}:${k}`, v])))),
    };
    setGradeResult(merged);
    setShowResults(true);

    try {
      await submitAttempt({
        test_id: testId,
        scope,
        passage_number: passageNumber,
        score: merged.score,
        total: merged.total,
        answers: Object.fromEntries(Object.entries(answers).map(([k, v]) => [k, v])),
      });
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not save your result");
    }
  }

  function retake() {
    setAnswers({});
    setChecked(false);
    setShowResults(false);
    setGradeResult(null);
    setSecondsLeft(defaultSeconds);
    setElapsed(0);
    setSaveError(null);
  }

  const answeredCount = allQuestions.filter((q) => (answers[q] ?? "") !== "").length;

  function goToQuestion(q: number) {
    setCurQuestion(q);
    const pIdx = passages.findIndex((p) => p.question_groups.some((g) => questionsInGroup(g).includes(q)));
    if (pIdx >= 0) setActiveIdx(pIdx);
    setTimeout(() => {
      document.getElementById(`rq-${q}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  }

  if (!started) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-[#1a0f30] via-[#0f0a1f] to-black p-4">
        <div className="w-full max-w-md rounded-2xl border border-purple-400/30 bg-gradient-to-b from-[#2e1a4d] via-[#1a0f30] to-[#0a0614] p-8 text-center text-white shadow-2xl">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-purple-400/20 text-3xl">📖</div>
          <h2 className="mb-1 text-xl font-extrabold">{scopeLabel}</h2>
          <p className="mb-6 text-sm text-purple-200">{testTitle}</p>
          <div className="mb-5 rounded-xl border border-purple-400/25 bg-white/5 px-4 py-3 text-left text-xs leading-relaxed text-purple-100">
            🎯 <strong className="text-amber-300">Exam Mode</strong> runs a {Math.round(defaultSeconds / 60)}-minute countdown
            that auto-submits at zero. 🧘 <strong className="text-amber-300">Casual Mode</strong> counts up with no limit.
          </div>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => {
                setMode("exam");
                setStarted(true);
              }}
              className="rounded-xl bg-red-600 px-6 py-3 text-sm font-extrabold text-white hover:bg-red-700"
            >
              🎯 Exam Mode
            </button>
            <button
              onClick={() => {
                setMode("casual");
                setStarted(true);
              }}
              className="rounded-xl bg-amber-300 px-6 py-3 text-sm font-extrabold text-purple-950 hover:bg-amber-200"
            >
              🧘 Casual Mode
            </button>
          </div>
          <Link href={backHref} className="mt-5 inline-block text-xs font-medium text-purple-300 hover:underline">
            &larr; Back
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 z-40 flex flex-col ${t.bg} ${t.text}`}>
      <header className={`flex h-14 shrink-0 items-center gap-4 border-b px-4 ${t.panel} ${t.border}`}>
        <div className="min-w-0 flex-1">
          <span className="font-extrabold text-red-600">{scopeLabel}</span>
          <span className={`ml-2 truncate text-sm ${t.subtext}`}>{testTitle}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFontScale((s) => Math.max(0.85, s - 0.08))}
            className={`h-7 w-7 rounded-md text-xs font-bold ${t.tint}`}
          >
            A-
          </button>
          <button
            onClick={() => setFontScale((s) => Math.min(1.3, s + 0.08))}
            className={`h-7 w-7 rounded-md text-xs font-bold ${t.tint}`}
          >
            A+
          </button>
          <div
            className={`rounded-md px-3 py-1 font-mono text-sm font-semibold ${t.tint} ${
              mode === "exam" && secondsLeft <= 300 ? "animate-pulse text-red-600" : ""
            }`}
          >
            {mode === "exam" ? fmt(secondsLeft) : fmt(elapsed)}
          </div>
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
              mode === "exam" ? "bg-red-600 text-white" : "bg-amber-300 text-purple-950"
            }`}
          >
            {mode === "exam" ? "🎯 Exam" : "🧘 Casual"}
          </span>
          <button onClick={toggleFullscreen} className={`h-7 w-7 rounded-md text-sm ${t.tint}`} title="Fullscreen">
            {isFullscreen ? "⤡" : "⤢"}
          </button>
          <button onClick={cycleTheme} className={`h-7 w-7 rounded-md text-sm ${t.tint}`} title="Theme">
            {theme === "light" ? "🌙" : theme === "dark" ? "🌃" : "☀️"}
          </button>
          <Link href={backHref} className={`h-7 rounded-md px-2 text-xs font-semibold leading-7 ${t.tint}`}>
            Exit
          </Link>
        </div>
      </header>

      {passages.length > 1 && (
        <div className={`flex shrink-0 gap-2 border-b px-4 py-2 ${t.border}`}>
          {passages.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setActiveIdx(i)}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                i === activeIdx ? "bg-red-600 text-white" : `${t.tint} ${t.subtext}`
              }`}
            >
              Passage {p.passage_number}
            </button>
          ))}
        </div>
      )}

      <div className="relative flex min-h-0 flex-1" style={{ fontSize: `${fontScale * 100}%` }}>
        <div className={`overflow-y-auto p-6 ${t.panel}`} style={{ width: `${leftWidthPct}%` }}>
          <h2 className="mb-1 text-lg font-extrabold">{passage.title}</h2>
          {passage.subtitle && <p className={`mb-4 border-b pb-3 italic ${t.subtext} ${t.border}`}>{passage.subtitle}</p>}

          {passage.paragraphs.map((para) => {
            const mhGroup = passage.question_groups.find((g) => g.type === "matching_headings") as
              | MatchingHeadingsGroup
              | undefined;
            const mhItem = mhGroup?.items.find((i) => i.paragraphLetter === para.letter);
            const placedCode = mhItem ? answers[mhItem.question] : undefined;
            const placedHeading = mhGroup?.headings.find((h) => h.code === placedCode);

            return (
              <div key={para.letter} className="mb-4">
                {mhGroup && mhItem && (
                  <div
                    id={`rq-${mhItem.question}`}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      placeHeading(mhGroup, para.letter, e.dataTransfer.getData("text/plain"));
                    }}
                    onClick={() => {
                      if (armedCode) placeHeading(mhGroup, para.letter, armedCode);
                      else if (placedCode) clearHeadingSlot(mhGroup, para.letter);
                    }}
                    className={`mb-1.5 inline-flex min-h-[34px] w-full cursor-pointer items-center gap-2 rounded-md border-2 border-dashed px-3 py-1.5 text-sm font-semibold ${
                      placedCode
                        ? checked
                          ? answers[mhItem.question] === mhItem.answerCode
                            ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                            : "border-red-500 bg-red-50 text-red-800"
                          : "border-red-500 border-solid"
                        : `${t.border} ${t.subtext}`
                    }`}
                  >
                    {placedCode ? (
                      <>
                        <strong>{placedCode}</strong> {placedHeading?.label}
                      </>
                    ) : (
                      `Question ${mhItem.question} — drop a heading here`
                    )}
                  </div>
                )}
                <p className="text-justify leading-relaxed">
                  <span className="mr-1.5 font-extrabold text-red-600">{para.letter}</span>
                  {splitOnGlossary(para.text, passage.glossary).map((part, i) =>
                    typeof part === "string" ? (
                      <span key={i}>{part}</span>
                    ) : (
                      <span
                        key={i}
                        onClick={(e) => setGlossaryPopup({ x: e.clientX, y: e.clientY, term: part.term })}
                        className="cursor-pointer border-b border-dotted border-purple-400 text-inherit"
                      >
                        {part.term.word}
                      </span>
                    ),
                  )}
                </p>
              </div>
            );
          })}
        </div>

        <div
          ref={dragRef}
          onMouseDown={startDrag}
          className={`w-1.5 shrink-0 cursor-col-resize border-x ${t.border} ${t.tint}`}
        />

        <div className={`flex-1 overflow-y-auto p-6 ${t.panel}`}>
          {passage.question_groups.map((group, gi) => (
            <div key={gi} className="mb-8">
              {group.type === "matching_headings" && (
                <MatchingHeadingsPanel
                  group={group}
                  answers={answers}
                  armedCode={armedCode}
                  setArmedCode={setArmedCode}
                  checked={checked}
                  tint={t.tint}
                  border={t.border}
                  subtext={t.subtext}
                />
              )}
              {group.type === "matching_features" && (
                <MatchingFeaturesPanel
                  group={group}
                  answers={answers}
                  setAnswers={setAnswers}
                  checked={checked}
                  tint={t.tint}
                  border={t.border}
                />
              )}
              {group.type === "summary_completion" && (
                <SummaryCompletionPanel
                  group={group}
                  answers={answers}
                  setAnswers={setAnswers}
                  checked={checked}
                  tint={t.tint}
                  border={t.border}
                />
              )}
            </div>
          ))}
        </div>

        {glossaryPopup && (
          <div
            className="fixed z-50 max-w-[280px] rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 shadow-xl"
            style={{ left: Math.min(glossaryPopup.x, window.innerWidth - 300), top: glossaryPopup.y + 12 }}
            onClick={() => setGlossaryPopup(null)}
          >
            <p className="mb-1 font-extrabold capitalize text-purple-700">{glossaryPopup.term.word}</p>
            <p className="mb-1">{glossaryPopup.term.def}</p>
            {glossaryPopup.term.syn && <p className="text-xs text-slate-500">Synonyms: {glossaryPopup.term.syn}</p>}
            {glossaryPopup.term.uz && <p className="mt-1 border-t border-dashed border-slate-200 pt-1 text-xs text-slate-500">🇺🇿 {glossaryPopup.term.uz}</p>}
          </div>
        )}
      </div>

      <nav className={`flex h-14 shrink-0 items-center gap-2 border-t px-4 ${t.panel} ${t.border}`}>
        <button
          onClick={() => {
            const i = curQuestion ? allQuestions.indexOf(curQuestion) : -1;
            if (i > 0) goToQuestion(allQuestions[i - 1]);
          }}
          className={`h-8 w-8 rounded-md ${t.tint}`}
        >
          ◀
        </button>
        <div className="flex flex-1 gap-1 overflow-x-auto">
          {allQuestions.map((q) => {
            const answeredQ = (answers[q] ?? "") !== "";
            const correctQ = checked && gradeResult?.perQuestion.find((p) => p.question === q)?.correct;
            const wrongQ = checked && gradeResult && !correctQ;
            return (
              <button
                key={q}
                onClick={() => goToQuestion(q)}
                className={`h-7 w-7 shrink-0 rounded-md border text-xs font-bold ${
                  correctQ
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : wrongQ
                      ? "border-red-600 bg-red-600 text-white"
                      : answeredQ
                        ? "border-blue-300 bg-blue-100 text-blue-800"
                        : `${t.border} ${t.tint}`
                }`}
              >
                {q}
              </button>
            );
          })}
        </div>
        <span className={`shrink-0 text-xs font-semibold ${t.subtext}`}>
          {checked ? `${gradeResult?.score}/${gradeResult?.total} correct` : `${answeredCount} of ${allQuestions.length} answered`}
        </span>
        <button
          onClick={() => setShowGlossaryList(true)}
          className={`hidden shrink-0 rounded-full border border-purple-400 px-3 py-1.5 text-xs font-bold text-purple-600 sm:inline-flex ${t.tint}`}
        >
          📖 Glossary
        </button>
        <button
          onClick={() => (checked ? setShowResults(true) : doCheck())}
          className={`shrink-0 rounded-lg px-4 py-2 text-sm font-bold text-white ${checked ? "bg-emerald-600" : "bg-red-600"}`}
        >
          {checked ? "📊 My Result" : "✓ Check Answers"}
        </button>
        <button
          onClick={() => {
            const i = curQuestion ? allQuestions.indexOf(curQuestion) : -1;
            if (i < allQuestions.length - 1) goToQuestion(allQuestions[i + 1]);
          }}
          className={`h-8 w-8 rounded-md ${t.tint}`}
        >
          ▶
        </button>
      </nav>

      {saveError && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-lg">
          {saveError}
        </div>
      )}

      {showResults && gradeResult && (
        <ResultsModal
          result={gradeResult}
          onRetake={retake}
          onClose={() => setShowResults(false)}
        />
      )}

      {showGlossaryList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowGlossaryList(false)}>
          <div className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-3 text-center text-lg font-extrabold text-slate-900">📖 Glossary</h2>
            {passages.flatMap((p) => p.glossary).map((g, i) => (
              <div key={i} className="border-b border-slate-100 py-2.5 last:border-0">
                <p className="font-extrabold capitalize text-purple-700">{g.word}</p>
                <p className="text-sm text-slate-700">{g.def}</p>
                {g.syn && <p className="text-xs text-slate-500">Synonyms: {g.syn}</p>}
                {g.uz && <p className="text-xs text-slate-500">🇺🇿 {g.uz}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {checked && (wordsHref || synonymsHref) && (
        <div className="fixed bottom-20 right-4 flex flex-col gap-2">
          {wordsHref && (
            <Link href={wordsHref} className="rounded-full bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-lg hover:bg-indigo-500">
              📚 Word Practice
            </Link>
          )}
          {synonymsHref && (
            <Link href={synonymsHref} className="rounded-full bg-fuchsia-600 px-4 py-2 text-xs font-bold text-white shadow-lg hover:bg-fuchsia-500">
              🔎 Synonym Practice
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function MatchingHeadingsPanel({
  group,
  answers,
  armedCode,
  setArmedCode,
  checked,
  tint,
  border,
  subtext,
}: {
  group: MatchingHeadingsGroup;
  answers: Record<number, string>;
  armedCode: string | null;
  setArmedCode: (c: string | null) => void;
  checked: boolean;
  tint: string;
  border: string;
  subtext: string;
}) {
  const usedCodes = new Set(group.items.map((it) => answers[it.question]).filter(Boolean));
  return (
    <div>
      <p className="mb-1 text-xs font-extrabold uppercase tracking-wide">{group.label}</p>
      <p className={`mb-3 text-sm italic ${subtext}`}>
        Choose the correct heading for each paragraph. Drag a heading onto a slot, or tap one then tap a slot.
      </p>
      <div className={`space-y-2 rounded-xl border p-3 ${border} ${tint}`}>
        {group.headings.map((h) => {
          const used = usedCodes.has(h.code);
          return (
            <div
              key={h.code}
              draggable={!checked && !used}
              onDragStart={(e) => e.dataTransfer.setData("text/plain", h.code)}
              onClick={() => !checked && !used && setArmedCode(armedCode === h.code ? null : h.code)}
              className={`cursor-grab rounded-lg border px-3 py-2 text-sm ${border} ${
                used ? "cursor-not-allowed opacity-40" : armedCode === h.code ? "border-red-500 ring-2 ring-red-200" : "bg-white"
              }`}
            >
              <strong>{h.code}</strong>&nbsp;&nbsp;{h.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MatchingFeaturesPanel({
  group,
  answers,
  setAnswers,
  checked,
  tint,
  border,
}: {
  group: MatchingFeaturesGroup;
  answers: Record<number, string>;
  setAnswers: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  checked: boolean;
  tint: string;
  border: string;
}) {
  return (
    <div>
      <p className="mb-1 text-xs font-extrabold uppercase tracking-wide">{group.label}</p>
      <div className={`mb-3 rounded-xl border p-3 text-sm ${border} ${tint}`}>
        {group.statements.map((s) => (
          <p key={s.code} className="mb-1">
            <strong>{s.code}</strong> {s.text}
          </p>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-center text-xs">
          <thead>
            <tr>
              <th></th>
              {group.statements.map((s) => (
                <th key={s.code} className={`border p-1.5 font-bold ${border} ${tint}`}>
                  {s.code}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {group.items.map((it, i) => {
              const q = group.startQuestion + i;
              return (
                <tr key={q} id={`rq-${q}`}>
                  <td className={`border p-1.5 text-left font-semibold ${border}`}>
                    <span className={`mr-1 rounded border px-1.5 py-0.5 text-[10px] ${border}`}>{q}</span>
                    {it.personOrFeature}
                  </td>
                  {group.statements.map((s) => (
                    <td key={s.code} className={`border p-1.5 ${border}`}>
                      <input
                        type="radio"
                        name={`q${q}`}
                        checked={answers[q] === s.code}
                        disabled={checked}
                        onChange={() => setAnswers((prev) => ({ ...prev, [q]: s.code }))}
                      />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SummaryCompletionPanel({
  group,
  answers,
  setAnswers,
  checked,
  tint,
  border,
}: {
  group: SummaryCompletionGroup;
  answers: Record<number, string>;
  setAnswers: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  checked: boolean;
  tint: string;
  border: string;
}) {
  const parts = group.text.split(/\{\{(\d+)\}\}/g);
  return (
    <div>
      <p className="mb-1 text-xs font-extrabold uppercase tracking-wide">{group.label}</p>
      <div className={`rounded-xl border p-4 text-sm leading-loose ${border} ${tint}`}>
        {group.title && <p className="mb-2 font-bold">{group.title}</p>}
        <p>
          {parts.map((part, i) => {
            if (i % 2 === 1) {
              const q = Number(part);
              const correct = answers[q];
              return (
                <input
                  key={i}
                  id={`rq-${q}`}
                  value={answers[q] ?? ""}
                  disabled={checked}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [q]: e.target.value }))}
                  className={`mx-1 w-32 border-b-2 bg-transparent px-1 text-sm outline-none ${
                    checked ? (correct ? "border-emerald-500" : "border-red-500") : "border-slate-400"
                  }`}
                />
              );
            }
            return <span key={i}>{part}</span>;
          })}
        </p>
      </div>
    </div>
  );
}
