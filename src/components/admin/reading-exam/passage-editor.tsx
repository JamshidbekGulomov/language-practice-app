"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { extractPdfText } from "@/lib/reading-exam/pdf-text";
import {
  updatePassage,
  addWord,
  deleteWord,
  createPdfUploadUrl,
  extractPassage,
  solveHeadings,
  solveFeatures,
  solveSummary,
  suggestWords,
  addWordsBulk,
} from "@/app/admin/reading-exam/actions";
import type {
  ReadingExamPassage,
  ReadingExamWord,
  Paragraph,
  GlossaryTerm,
  ParaphrasePair,
  MatchingHeadingsGroup,
  MatchingFeaturesGroup,
  SummaryCompletionGroup,
  QuestionGroup,
} from "@/lib/reading-exam/types";

function updateAt<T>(arr: T[], i: number, patch: Partial<T>): T[] {
  return arr.map((item, idx) => (idx === i ? { ...item, ...patch } : item));
}
function removeAt<T>(arr: T[], i: number): T[] {
  return arr.filter((_, idx) => idx !== i);
}

const inputCls = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm";
const smallInputCls = "rounded-lg border border-slate-300 px-2 py-1.5 text-sm";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <h3 className="mb-3 font-bold text-slate-900">{title}</h3>
      {children}
    </div>
  );
}

export function PassageEditor({
  passage,
  words,
}: {
  passage: ReadingExamPassage;
  words: ReadingExamWord[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [aiPending, setAiPending] = useState(false);
  const [aiProgress, setAiProgress] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiApplied, setAiApplied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [textPending, setTextPending] = useState(false);
  const [textError, setTextError] = useState<string | null>(null);
  const [textApplied, setTextApplied] = useState(false);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const textFileInputRef = useRef<HTMLInputElement>(null);

  const [wordSuggestions, setWordSuggestions] = useState<{ word: string; meaning: string; checked: boolean }[]>([]);
  const [suggestingWords, setSuggestingWords] = useState(false);
  const [wordSuggestError, setWordSuggestError] = useState<string | null>(null);

  const [title, setTitle] = useState(passage.title);
  const [subtitle, setSubtitle] = useState(passage.subtitle ?? "");
  const [paragraphs, setParagraphs] = useState<Paragraph[]>(
    passage.paragraphs.length ? passage.paragraphs : [{ letter: "A", text: "" }],
  );
  const [glossary, setGlossary] = useState<GlossaryTerm[]>(passage.glossary);
  const [paraphrasePairs, setParaphrasePairs] = useState<ParaphrasePair[]>(passage.paraphrase_pairs);

  const existingMH = passage.question_groups.find((g) => g.type === "matching_headings") as
    | MatchingHeadingsGroup
    | undefined;
  const existingMF = passage.question_groups.find((g) => g.type === "matching_features") as
    | MatchingFeaturesGroup
    | undefined;
  const existingSC = passage.question_groups.find((g) => g.type === "summary_completion") as
    | SummaryCompletionGroup
    | undefined;

  const [useMH, setUseMH] = useState(!!existingMH);
  const [mh, setMh] = useState<MatchingHeadingsGroup>(
    existingMH ?? { type: "matching_headings", label: "Matching Headings", startQuestion: 1, headings: [], items: [] },
  );
  const [useMF, setUseMF] = useState(!!existingMF);
  const [mf, setMf] = useState<MatchingFeaturesGroup>(
    existingMF ?? {
      type: "matching_features",
      label: "Matching Features",
      startQuestion: 1,
      statements: [],
      items: [],
    },
  );
  const [useSC, setUseSC] = useState(!!existingSC);
  const [sc, setSc] = useState<SummaryCompletionGroup>(
    existingSC ?? {
      type: "summary_completion",
      label: "Summary Completion",
      startQuestion: 1,
      title: "",
      text: "",
      answers: [],
    },
  );

  const blankNumbers = Array.from(new Set([...sc.text.matchAll(/\{\{(\d+)\}\}/g)].map((m) => Number(m[1])))).sort(
    (a, b) => a - b,
  );

  function handleSave() {
    const question_groups: QuestionGroup[] = [];
    if (useMH) {
      question_groups.push({
        ...mh,
        items: mh.items.map((it, i) => ({ ...it, question: mh.startQuestion + i })),
      });
    }
    if (useMF) {
      question_groups.push({
        ...mf,
        items: mf.items.map((it, i) => ({ ...it, question: mf.startQuestion + i })),
      });
    }
    if (useSC) {
      question_groups.push({
        ...sc,
        answers: blankNumbers.map((n) => ({
          question: n,
          answer: sc.answers.find((a) => a.question === n)?.answer ?? "",
        })),
      });
    }

    startTransition(async () => {
      await updatePassage(passage.id, {
        title,
        subtitle: subtitle || null,
        paragraphs,
        glossary,
        question_groups,
        paraphrase_pairs: paraphrasePairs,
      });
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    });
  }

  async function handleAnalyzePdf() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setAiError("Choose a PDF first");
      return;
    }
    setAiError(null);
    setAiApplied(false);
    setAiPending(true);
    try {
      setAiProgress("Uploading PDF…");
      const uploadUrlResult = await createPdfUploadUrl(file.name);
      if (!uploadUrlResult.ok) {
        setAiError(uploadUrlResult.error);
        return;
      }
      const { path, token } = uploadUrlResult.data;
      const { error: uploadError } = await supabase.storage.from("admin-uploads").uploadToSignedUrl(path, token, file);
      if (uploadError) {
        setAiError(uploadError.message);
        return;
      }

      setAiProgress("Reading passage and questions with AI…");
      const extraction = await extractPassage(path);
      if (!extraction.ok) {
        setAiError(extraction.error);
        return;
      }
      const draft = extraction.data;

      if (draft.title) setTitle(draft.title);
      if (draft.subtitle) setSubtitle(draft.subtitle);
      if (draft.paragraphs.length) setParagraphs(draft.paragraphs);
      if (draft.glossary.length) setGlossary(draft.glossary);
      if (draft.paraphrase_pairs.length) setParaphrasePairs(draft.paraphrase_pairs);

      // Answering each question type is a separate, smaller AI call run after
      // extraction — one call trying to extract AND answer everything at once
      // routinely exceeded the platform's per-request time limit.
      const warnings: string[] = [];

      if (draft.matching_headings.present) {
        setAiProgress("Solving Matching Headings…");
        const mh = draft.matching_headings;
        const solved = await solveHeadings(draft.paragraphs, mh.headings, mh.paragraphLetters, mh.startQuestion || 1);
        if (solved.ok) {
          setUseMH(true);
          setMh({ type: "matching_headings", label: mh.label || "Matching Headings", startQuestion: mh.startQuestion || 1, headings: mh.headings, items: solved.data });
        } else {
          warnings.push(`Matching Headings: ${solved.error}`);
        }
      }

      if (draft.matching_features.present) {
        setAiProgress("Solving Matching Features…");
        const mf = draft.matching_features;
        const solved = await solveFeatures(draft.paragraphs, mf.statements, mf.personsOrFeatures, mf.startQuestion || 1);
        if (solved.ok) {
          setUseMF(true);
          setMf({ type: "matching_features", label: mf.label || "Matching Features", startQuestion: mf.startQuestion || 1, statements: mf.statements, items: solved.data });
        } else {
          warnings.push(`Matching Features: ${solved.error}`);
        }
      }

      if (draft.summary_completion.present) {
        setAiProgress("Solving Summary Completion…");
        const sc0 = draft.summary_completion;
        const solved = await solveSummary(draft.paragraphs, sc0.text);
        if (solved.ok) {
          setUseSC(true);
          setSc({ type: "summary_completion", label: sc0.label || "Summary Completion", startQuestion: sc0.startQuestion || 1, title: sc0.title, text: sc0.text, answers: solved.data });
        } else {
          warnings.push(`Summary Completion: ${solved.error}`);
        }
      }

      setAiApplied(true);
      setAiError(warnings.length > 0 ? `Passage filled in, but: ${warnings.join("; ")}` : null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "AI analysis failed");
    } finally {
      setAiPending(false);
      setAiProgress(null);
    }
  }

  async function handleSuggestWords() {
    setWordSuggestError(null);
    setSuggestingWords(true);
    try {
      const text = paragraphs.map((p) => p.text).join("\n\n");
      const result = await suggestWords(text);
      if (!result.ok) {
        setWordSuggestError(result.error);
        return;
      }
      setWordSuggestions(result.data.map((w) => ({ ...w, checked: true })));
    } catch (err) {
      setWordSuggestError(err instanceof Error ? err.message : "Suggestion failed");
    } finally {
      setSuggestingWords(false);
    }
  }

  function handleAddCheckedWords() {
    const chosen = wordSuggestions.filter((w) => w.checked).map(({ word, meaning }) => ({ word, meaning }));
    if (chosen.length === 0) return;
    startTransition(async () => {
      await addWordsBulk(passage.id, chosen);
      setWordSuggestions([]);
      router.refresh();
    });
  }

  async function handleLoadTextFromPdf() {
    const file = textFileInputRef.current?.files?.[0];
    if (!file) {
      setTextError("Choose a PDF first");
      return;
    }
    setTextError(null);
    setTextApplied(false);
    setTextPending(true);
    try {
      const { paragraphs: extracted, fullText } = await extractPdfText(file);
      if (!fullText) {
        setTextError("Couldn't find any text in that PDF (it may be a scanned image).");
        return;
      }
      if (extracted.length > 0) setParagraphs(extracted);
      setExtractedText(fullText);
      setTextApplied(true);
      if (textFileInputRef.current) textFileInputRef.current.value = "";
    } catch (err) {
      setTextError(err instanceof Error ? err.message : "Couldn't read that PDF");
    } finally {
      setTextPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <Section title="📄 Load text from a PDF (no AI)">
        <p className="mb-3 text-xs text-slate-500">
          Pulls the raw text out of the PDF, entirely in your browser — no AI, no server call, instant. It guesses
          paragraph breaks (from lettered markers like &ldquo;A&rdquo;, or blank lines) and fills the passage
          paragraphs below. If your PDF also has the questions in it, they&apos;ll show up as extra paragraph rows —
          delete those from the list below, then use the &ldquo;Full extracted text&rdquo; box underneath to copy
          the headings/statements/answers into the matching Matching Headings, Matching Features, and Summary
          Completion fields further down.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <input ref={textFileInputRef} type="file" accept="application/pdf" className="text-sm" />
          <button
            onClick={handleLoadTextFromPdf}
            disabled={textPending}
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
          >
            {textPending ? "Reading PDF…" : "Load text"}
          </button>
          {textApplied && <span className="text-sm font-medium text-emerald-600">Paragraphs filled in below ✓</span>}
        </div>
        {textError && <p className="mt-2 text-sm text-red-600">{textError}</p>}

        {extractedText && (
          <div className="mt-4">
            <p className="mb-1 text-xs font-semibold text-slate-500">
              Full extracted text (passage + questions, whatever the PDF has) — select and copy from here into any
              field below
            </p>
            <textarea
              readOnly
              value={extractedText}
              rows={12}
              onFocus={(e) => e.target.select()}
              className="w-full whitespace-pre-wrap rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-700"
            />
          </div>
        )}
      </Section>

      <Section title="🤖 Analyze a PDF with AI (optional)">
        <p className="mb-3 text-xs text-slate-500">
          Upload the exam PDF (passage + questions) and AI will fill in the passage, glossary, question groups, and
          its own best-guess answers below — review and correct everything before saving. Slower and less
          predictable than &ldquo;Load text&rdquo; above; use it if you also want a first pass at the questions.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <input ref={fileInputRef} type="file" accept="application/pdf" className="text-sm" />
          <button
            onClick={handleAnalyzePdf}
            disabled={aiPending}
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-500 disabled:opacity-50"
          >
            {aiPending ? (aiProgress ?? "Analyzing…") : "Analyze PDF"}
          </button>
          {aiApplied && <span className="text-sm font-medium text-emerald-600">Filled in below — please review ✓</span>}
        </div>
        {aiError && <p className="mt-2 text-sm text-red-600">{aiError}</p>}
      </Section>

      <Section title="Passage text">
        <div className="space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Passage title"
            className={inputCls}
          />
          <input
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="Subtitle / intro line (optional)"
            className={inputCls}
          />

          {paragraphs.map((p, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={p.letter}
                onChange={(e) => setParagraphs(updateAt(paragraphs, i, { letter: e.target.value }))}
                className={`${smallInputCls} w-14 text-center font-bold`}
                maxLength={2}
              />
              <textarea
                value={p.text}
                onChange={(e) => setParagraphs(updateAt(paragraphs, i, { text: e.target.value }))}
                rows={4}
                placeholder="Paragraph text"
                className={`${inputCls} flex-1`}
              />
              <button
                onClick={() => setParagraphs(removeAt(paragraphs, i))}
                className="self-start text-xs text-red-600 hover:underline"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            onClick={() =>
              setParagraphs([
                ...paragraphs,
                { letter: String.fromCharCode(65 + paragraphs.length), text: "" },
              ])
            }
            className="text-sm font-medium text-indigo-600 hover:underline"
          >
            + Add paragraph
          </button>
        </div>
      </Section>

      <Section title="Glossary (words readers can tap for a definition)">
        <div className="space-y-2">
          {glossary.map((g, i) => (
            <div key={i} className="grid grid-cols-1 gap-2 sm:grid-cols-5">
              <input
                value={g.word}
                onChange={(e) => setGlossary(updateAt(glossary, i, { word: e.target.value }))}
                placeholder="word"
                className={smallInputCls}
              />
              <input
                value={g.def}
                onChange={(e) => setGlossary(updateAt(glossary, i, { def: e.target.value }))}
                placeholder="definition"
                className={`${smallInputCls} sm:col-span-2`}
              />
              <input
                value={g.syn}
                onChange={(e) => setGlossary(updateAt(glossary, i, { syn: e.target.value }))}
                placeholder="synonyms"
                className={smallInputCls}
              />
              <div className="flex gap-2">
                <input
                  value={g.uz}
                  onChange={(e) => setGlossary(updateAt(glossary, i, { uz: e.target.value }))}
                  placeholder="Uzbek"
                  className={`${smallInputCls} flex-1`}
                />
                <button onClick={() => setGlossary(removeAt(glossary, i))} className="text-xs text-red-600">
                  ✕
                </button>
              </div>
            </div>
          ))}
          <button
            onClick={() => setGlossary([...glossary, { word: "", def: "", syn: "", uz: "" }])}
            className="text-sm font-medium text-indigo-600 hover:underline"
          >
            + Add glossary term
          </button>
        </div>
      </Section>

      <Section title="Matching Headings">
        <label className="mb-3 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={useMH} onChange={(e) => setUseMH(e.target.checked)} />
          Include this question type
        </label>
        {useMH && (
          <div className="space-y-4">
            <div className="flex gap-3">
              <input
                value={mh.label}
                onChange={(e) => setMh({ ...mh, label: e.target.value })}
                placeholder="Group label"
                className={`${inputCls} flex-1`}
              />
              <input
                type="number"
                value={mh.startQuestion}
                onChange={(e) => setMh({ ...mh, startQuestion: Number(e.target.value) })}
                placeholder="First question #"
                className={`${smallInputCls} w-40`}
              />
            </div>

            <div>
              <p className="mb-1 text-xs font-semibold text-slate-500">Heading options (with distractors)</p>
              {mh.headings.map((h, i) => (
                <div key={i} className="mb-2 flex gap-2">
                  <input
                    value={h.code}
                    onChange={(e) => setMh({ ...mh, headings: updateAt(mh.headings, i, { code: e.target.value }) })}
                    placeholder="i"
                    className={`${smallInputCls} w-14 text-center`}
                  />
                  <input
                    value={h.label}
                    onChange={(e) => setMh({ ...mh, headings: updateAt(mh.headings, i, { label: e.target.value }) })}
                    placeholder="Heading text"
                    className={`${inputCls} flex-1`}
                  />
                  <button onClick={() => setMh({ ...mh, headings: removeAt(mh.headings, i) })} className="text-xs text-red-600">
                    ✕
                  </button>
                </div>
              ))}
              <button
                onClick={() => setMh({ ...mh, headings: [...mh.headings, { code: "", label: "" }] })}
                className="text-sm font-medium text-indigo-600 hover:underline"
              >
                + Add heading option
              </button>
            </div>

            <div>
              <p className="mb-1 text-xs font-semibold text-slate-500">
                Correct answer per paragraph (question numbers assigned in order starting at {mh.startQuestion})
              </p>
              {mh.items.map((it, i) => (
                <div key={i} className="mb-2 flex items-center gap-2">
                  <span className="w-8 shrink-0 text-center text-xs font-bold text-slate-400">
                    Q{mh.startQuestion + i}
                  </span>
                  <select
                    value={it.paragraphLetter}
                    onChange={(e) => setMh({ ...mh, items: updateAt(mh.items, i, { paragraphLetter: e.target.value }) })}
                    className={smallInputCls}
                  >
                    <option value="">Paragraph…</option>
                    {paragraphs.map((p) => (
                      <option key={p.letter} value={p.letter}>
                        {p.letter}
                      </option>
                    ))}
                  </select>
                  <select
                    value={it.answerCode}
                    onChange={(e) => setMh({ ...mh, items: updateAt(mh.items, i, { answerCode: e.target.value }) })}
                    className={smallInputCls}
                  >
                    <option value="">Correct heading…</option>
                    {mh.headings.map((h) => (
                      <option key={h.code} value={h.code}>
                        {h.code} — {h.label}
                      </option>
                    ))}
                  </select>
                  <button onClick={() => setMh({ ...mh, items: removeAt(mh.items, i) })} className="text-xs text-red-600">
                    ✕
                  </button>
                </div>
              ))}
              <button
                onClick={() =>
                  setMh({ ...mh, items: [...mh.items, { question: 0, paragraphLetter: "", answerCode: "" }] })
                }
                className="text-sm font-medium text-indigo-600 hover:underline"
              >
                + Add paragraph row
              </button>
            </div>
          </div>
        )}
      </Section>

      <Section title="Matching Features">
        <label className="mb-3 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={useMF} onChange={(e) => setUseMF(e.target.checked)} />
          Include this question type
        </label>
        {useMF && (
          <div className="space-y-4">
            <div className="flex gap-3">
              <input
                value={mf.label}
                onChange={(e) => setMf({ ...mf, label: e.target.value })}
                placeholder="Group label"
                className={`${inputCls} flex-1`}
              />
              <input
                type="number"
                value={mf.startQuestion}
                onChange={(e) => setMf({ ...mf, startQuestion: Number(e.target.value) })}
                placeholder="First question #"
                className={`${smallInputCls} w-40`}
              />
            </div>

            <div>
              <p className="mb-1 text-xs font-semibold text-slate-500">Statement list (with distractors)</p>
              {mf.statements.map((s, i) => (
                <div key={i} className="mb-2 flex gap-2">
                  <input
                    value={s.code}
                    onChange={(e) => setMf({ ...mf, statements: updateAt(mf.statements, i, { code: e.target.value }) })}
                    placeholder="A"
                    className={`${smallInputCls} w-14 text-center`}
                  />
                  <input
                    value={s.text}
                    onChange={(e) => setMf({ ...mf, statements: updateAt(mf.statements, i, { text: e.target.value }) })}
                    placeholder="Statement text"
                    className={`${inputCls} flex-1`}
                  />
                  <button onClick={() => setMf({ ...mf, statements: removeAt(mf.statements, i) })} className="text-xs text-red-600">
                    ✕
                  </button>
                </div>
              ))}
              <button
                onClick={() => setMf({ ...mf, statements: [...mf.statements, { code: "", text: "" }] })}
                className="text-sm font-medium text-indigo-600 hover:underline"
              >
                + Add statement
              </button>
            </div>

            <div>
              <p className="mb-1 text-xs font-semibold text-slate-500">
                Correct statement per person/feature (question numbers assigned in order starting at{" "}
                {mf.startQuestion})
              </p>
              {mf.items.map((it, i) => (
                <div key={i} className="mb-2 flex items-center gap-2">
                  <span className="w-8 shrink-0 text-center text-xs font-bold text-slate-400">
                    Q{mf.startQuestion + i}
                  </span>
                  <input
                    value={it.personOrFeature}
                    onChange={(e) => setMf({ ...mf, items: updateAt(mf.items, i, { personOrFeature: e.target.value }) })}
                    placeholder="Name / feature"
                    className={`${inputCls} flex-1`}
                  />
                  <select
                    value={it.answerCode}
                    onChange={(e) => setMf({ ...mf, items: updateAt(mf.items, i, { answerCode: e.target.value }) })}
                    className={smallInputCls}
                  >
                    <option value="">Correct statement…</option>
                    {mf.statements.map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.code} — {s.text.slice(0, 40)}
                      </option>
                    ))}
                  </select>
                  <button onClick={() => setMf({ ...mf, items: removeAt(mf.items, i) })} className="text-xs text-red-600">
                    ✕
                  </button>
                </div>
              ))}
              <button
                onClick={() =>
                  setMf({ ...mf, items: [...mf.items, { question: 0, personOrFeature: "", answerCode: "" }] })
                }
                className="text-sm font-medium text-indigo-600 hover:underline"
              >
                + Add row
              </button>
            </div>
          </div>
        )}
      </Section>

      <Section title="Summary Completion">
        <label className="mb-3 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={useSC} onChange={(e) => setUseSC(e.target.checked)} />
          Include this question type
        </label>
        {useSC && (
          <div className="space-y-3">
            <input
              value={sc.title}
              onChange={(e) => setSc({ ...sc, title: e.target.value })}
              placeholder="Summary title, e.g. The merits of the US mission"
              className={inputCls}
            />
            <textarea
              value={sc.text}
              onChange={(e) => setSc({ ...sc, text: e.target.value })}
              rows={6}
              placeholder="Summary text. Mark each blank with {{questionNumber}}, e.g. ...an asteroid could act as a {{23}} for further..."
              className={inputCls}
            />
            {blankNumbers.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-semibold text-slate-500">Correct answers</p>
                {blankNumbers.map((n) => (
                  <div key={n} className="mb-2 flex items-center gap-2">
                    <span className="w-8 shrink-0 text-center text-xs font-bold text-slate-400">Q{n}</span>
                    <input
                      value={sc.answers.find((a) => a.question === n)?.answer ?? ""}
                      onChange={(e) => {
                        const rest = sc.answers.filter((a) => a.question !== n);
                        setSc({ ...sc, answers: [...rest, { question: n, answer: e.target.value }] });
                      }}
                      placeholder="correct word"
                      className={`${smallInputCls} flex-1`}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Section>

      <Section title="Synonym / paraphrase practice">
        <p className="mb-3 text-xs text-slate-500">
          Key words from the question prompts, paired with the paraphrase that appears in the passage. Shown after
          the exam, with the passage visible, as a separate practice activity.
        </p>
        <div className="space-y-2">
          {paraphrasePairs.map((pp, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={pp.keyword}
                onChange={(e) => setParaphrasePairs(updateAt(paraphrasePairs, i, { keyword: e.target.value }))}
                placeholder="key word/phrase in the question"
                className={`${inputCls} flex-1`}
              />
              <input
                value={pp.phrase}
                onChange={(e) => setParaphrasePairs(updateAt(paraphrasePairs, i, { phrase: e.target.value }))}
                placeholder="matching word/phrase in the passage"
                className={`${inputCls} flex-1`}
              />
              <button onClick={() => setParaphrasePairs(removeAt(paraphrasePairs, i))} className="text-xs text-red-600">
                ✕
              </button>
            </div>
          ))}
          <button
            onClick={() => setParaphrasePairs([...paraphrasePairs, { keyword: "", phrase: "" }])}
            className="text-sm font-medium text-indigo-600 hover:underline"
          >
            + Add pair
          </button>
        </div>
      </Section>

      <Section title="Vocabulary (word practice after the exam)">
        <div className="mb-4 rounded-lg border border-purple-200 bg-purple-50 p-3">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleSuggestWords}
              disabled={suggestingWords || paragraphs.every((p) => !p.text.trim())}
              className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-purple-500 disabled:opacity-50"
            >
              {suggestingWords ? "Thinking…" : "🤖 Suggest words from passage"}
            </button>
            {wordSuggestError && <span className="text-xs text-red-600">{wordSuggestError}</span>}
          </div>
          {wordSuggestions.length > 0 && (
            <div className="mt-3 space-y-1">
              {wordSuggestions.map((w, i) => (
                <label key={i} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={w.checked}
                    onChange={() =>
                      setWordSuggestions(updateAt(wordSuggestions, i, { checked: !w.checked }))
                    }
                  />
                  <strong>{w.word}</strong> — {w.meaning}
                </label>
              ))}
              <button
                onClick={handleAddCheckedWords}
                disabled={isPending}
                className="mt-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
              >
                Add checked words
              </button>
            </div>
          )}
        </div>
        <div className="mb-3 space-y-1">
          {words.map((w) => (
            <div key={w.id} className="flex items-center justify-between rounded border border-slate-100 px-3 py-1.5 text-sm">
              <span>
                <strong>{w.word}</strong>
                {w.meaning ? ` — ${w.meaning}` : ""}
              </span>
              <button
                onClick={() =>
                  startTransition(async () => {
                    await deleteWord(w.id);
                    router.refresh();
                  })
                }
                className="text-xs text-red-600"
              >
                Remove
              </button>
            </div>
          ))}
          {words.length === 0 && <p className="text-sm text-slate-400">No words yet.</p>}
        </div>
        <form
          action={(fd) =>
            startTransition(async () => {
              await addWord(passage.id, fd);
              router.refresh();
            })
          }
          className="flex gap-2"
        >
          <input name="word" placeholder="Word" required className={smallInputCls} />
          <input name="meaning" placeholder="Meaning (optional)" className={`${smallInputCls} flex-1`} />
          <button type="submit" className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white">
            Add
          </button>
        </form>
      </Section>

      <div className="sticky bottom-0 flex items-center gap-3 border-t border-slate-200 bg-white py-4">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="rounded-lg bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:from-indigo-500 hover:to-fuchsia-500 disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save passage"}
        </button>
        {saved && <span className="text-sm font-medium text-emerald-600">Saved ✓</span>}
      </div>
    </div>
  );
}
