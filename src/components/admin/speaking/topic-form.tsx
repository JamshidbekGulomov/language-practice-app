"use client";

import { useState } from "react";
import { SPEAKING_EXAMS, type SpeakingExam } from "@/lib/speaking/exams";
import { createTopic } from "@/app/admin/speaking/actions";

export function TopicForm() {
  const [exam, setExam] = useState<SpeakingExam>("cefr");
  const parts = SPEAKING_EXAMS[exam].parts;

  return (
    <form action={createTopic} className="mb-8 space-y-3 rounded-lg border border-slate-200 p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <select
          name="exam"
          value={exam}
          onChange={(e) => setExam(e.target.value as SpeakingExam)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          {(Object.keys(SPEAKING_EXAMS) as SpeakingExam[]).map((key) => (
            <option key={key} value={key}>
              {SPEAKING_EXAMS[key].label}
            </option>
          ))}
        </select>
        <select key={exam} name="part" className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          {parts.map((p) => (
            <option key={p.key} value={p.key}>
              {p.label} — {p.description}
            </option>
          ))}
        </select>
      </div>
      <input
        name="title"
        placeholder="Topic title (e.g. Describe a memorable trip)"
        required
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      <textarea
        name="prompt"
        placeholder="Prompt / instructions for this part"
        rows={3}
        required
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      <button
        type="submit"
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
      >
        Create topic
      </button>
    </form>
  );
}
