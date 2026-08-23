"use client";

import { createTest } from "@/app/admin/reading-exam/actions";

export function NewTestForm() {
  return (
    <form action={createTest} className="mb-6 space-y-3 rounded-lg border border-slate-200 p-4">
      <input
        name="title"
        placeholder="Test title, e.g. Cambridge 18 Test 2"
        required
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      <select name="exam" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
        <option value="">Choose exam&hellip;</option>
        <option value="ielts">IELTS</option>
        <option value="cefr">CEFR</option>
      </select>
      <button
        type="submit"
        className="rounded-lg bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white transition hover:from-indigo-500 hover:to-fuchsia-500"
      >
        Create test (adds empty Passage 1, 2, 3)
      </button>
    </form>
  );
}
