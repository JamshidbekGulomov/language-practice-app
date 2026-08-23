"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getAudioPublicUrl } from "@/lib/listening/storage";
import { saveNote } from "@/app/listening-exam/actions";
import type { ListeningExamTest, ListeningExamSection } from "@/lib/listening-exam/types";

export function ListeningExamPlayer({
  test,
  sections,
  initialNote,
}: {
  test: ListeningExamTest;
  sections: ListeningExamSection[];
  initialNote: string;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [showTranscript, setShowTranscript] = useState(true);
  const [note, setNote] = useState(initialNote);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const section = sections[activeIdx];

  function handleNoteChange(value: string) {
    setNote(value);
    setSaveState("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await saveNote(test.id, value);
        setSaveState("saved");
      } catch {
        setSaveState("idle");
      }
    }, 1200);
  }

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{test.title}</h1>
      <p className="mt-1 text-sm text-slate-500">Full listening test &middot; notes autosave and are visible to your teacher.</p>

      {sections.length > 1 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {sections.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setActiveIdx(i)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
                i === activeIdx ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-3 font-bold text-slate-900">{section.label}</h2>
            <audio controls src={getAudioPublicUrl(section.audio_path)} className="w-full" />

            <button
              onClick={() => setShowTranscript((v) => !v)}
              className="mt-4 text-sm font-medium text-indigo-600 hover:underline"
            >
              {showTranscript ? "Hide transcript" : "Show transcript"}
            </button>
            {showTranscript && (
              <p className="mt-3 whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
                {section.transcript || "No transcript added for this section."}
              </p>
            )}
          </div>
        </div>

        <div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-bold text-slate-900">📝 My Notes</h2>
              <span className="text-xs text-slate-400">
                {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved ✓" : ""}
              </span>
            </div>
            <textarea
              value={note}
              onChange={(e) => handleNoteChange(e.target.value)}
              rows={16}
              placeholder="Take notes while you listen…"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <p className="mt-2 text-xs text-slate-400">Your teacher can see these notes to help you improve.</p>
          </div>
        </div>
      </div>

      <Link href={`/${test.exam}/listening`} className="mt-8 inline-block text-sm font-medium text-slate-500 hover:underline">
        &larr; Back
      </Link>
    </div>
  );
}
