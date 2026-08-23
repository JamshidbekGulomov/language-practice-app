"use client";

import { useRef, useState, useTransition } from "react";
import { addWord, suggestWord } from "@/app/admin/vocabulary/actions";

export function WordForm({ categoryId }: { categoryId: string }) {
  const [isSuggesting, startSuggesting] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const englishRef = useRef<HTMLInputElement>(null);
  const uzbekRef = useRef<HTMLInputElement>(null);
  const synonymRef = useRef<HTMLInputElement>(null);
  const difficultyRef = useRef<HTMLInputElement>(null);
  const exampleRef = useRef<HTMLInputElement>(null);

  function handleSuggest() {
    const english = englishRef.current?.value ?? "";
    setError(null);
    startSuggesting(async () => {
      const result = await suggestWord(english);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      const { suggestion } = result;
      if (suggestion.uzbek && uzbekRef.current) uzbekRef.current.value = suggestion.uzbek;
      if (suggestion.synonym && synonymRef.current) synonymRef.current.value = suggestion.synonym;
      if (suggestion.difficulty && difficultyRef.current) {
        difficultyRef.current.value = suggestion.difficulty;
      }
      if (suggestion.example_sentence && exampleRef.current) {
        exampleRef.current.value = suggestion.example_sentence;
      }
    });
  }

  return (
    <form
      action={addWord.bind(null, categoryId)}
      className="mt-6 grid grid-cols-1 gap-3 rounded-lg border border-slate-200 p-4 sm:grid-cols-2"
    >
      <div className="flex gap-2 sm:col-span-2">
        <input
          ref={englishRef}
          name="english"
          placeholder="English word"
          required
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={handleSuggest}
          disabled={isSuggesting}
          className="whitespace-nowrap rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          {isSuggesting ? "Asking AI…" : "Suggest with AI"}
        </button>
      </div>
      <input
        ref={uzbekRef}
        name="uzbek"
        placeholder="Uzbek translation"
        required
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      <input
        ref={synonymRef}
        name="synonym"
        placeholder="Synonym (optional)"
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      <input
        ref={difficultyRef}
        name="difficulty"
        placeholder="Difficulty (optional)"
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      <input
        ref={exampleRef}
        name="example_sentence"
        placeholder="Example sentence (optional)"
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
      />
      {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
      <button
        type="submit"
        className="rounded-lg bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white transition hover:from-indigo-500 hover:to-fuchsia-500 sm:col-span-2"
      >
        Add word
      </button>
    </form>
  );
}
