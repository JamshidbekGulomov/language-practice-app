"use client";

import { useState, useTransition } from "react";
import * as XLSX from "xlsx";
import { bulkImportWords, type BulkWordRow } from "@/app/admin/vocabulary/actions";

const HEADER_ALIASES: Record<string, keyof BulkWordRow> = {
  english: "english",
  "english word": "english",
  word: "english",
  uzbek: "uzbek",
  "uzbek translation": "uzbek",
  translation: "uzbek",
  synonym: "synonym",
  "example sentence": "example_sentence",
  example: "example_sentence",
  sentence: "example_sentence",
  difficulty: "difficulty",
};

function parseRows(raw: Record<string, unknown>[]): BulkWordRow[] {
  return raw.map((row) => {
    const mapped: BulkWordRow = { english: "", uzbek: "" };
    for (const [key, value] of Object.entries(row)) {
      const field = HEADER_ALIASES[key.trim().toLowerCase()];
      if (field && value != null) {
        mapped[field] = String(value).trim();
      }
    }
    return mapped;
  });
}

export function WordUploadForm({ categoryId }: { categoryId: string }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFile(file: File) {
    setError(null);
    setMessage(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result as ArrayBuffer;
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
        const rows = parseRows(raw);

        startTransition(async () => {
          try {
            const result = await bulkImportWords(categoryId, rows);
            setMessage(
              `Imported ${result.imported} word(s)${
                result.skipped ? `, skipped ${result.skipped} invalid row(s)` : ""
              }.`,
            );
          } catch (err) {
            setError(err instanceof Error ? err.message : "Import failed");
          }
        });
      } catch {
        setError("Couldn't read that file. Make sure it's a valid CSV or XLSX.");
      }
    };
    reader.readAsArrayBuffer(file);
  }

  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <p className="text-sm font-medium text-slate-700">Bulk upload (CSV or XLSX)</p>
      <p className="mt-1 text-xs text-slate-500">
        Columns: English, Uzbek (required), Synonym, Example, Difficulty (optional).
      </p>
      <input
        type="file"
        accept=".csv,.xlsx,.xls"
        disabled={isPending}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
        className="mt-3 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white hover:file:bg-indigo-500"
      />
      {isPending && <p className="mt-2 text-xs text-slate-500">Importing…</p>}
      {message && <p className="mt-2 text-xs text-emerald-600">{message}</p>}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
