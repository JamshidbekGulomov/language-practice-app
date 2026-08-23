import { adminList } from "@/lib/admin/crud";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { PassagesTable } from "@/components/admin/reading/passages-table";
import { createPassage, deletePassage } from "@/app/admin/reading/actions";
import type { ReadingPassage, ReadingWord } from "@/lib/reading/types";

export default async function AdminReadingPage() {
  const [passages, words] = await Promise.all([
    adminList<ReadingPassage>("reading_passages", { orderBy: "created_at", ascending: false }),
    adminList<Pick<ReadingWord, "passage_id">>("reading_words", { select: "passage_id" }),
  ]);

  const counts = new Map<string, number>();
  for (const w of words) counts.set(w.passage_id, (counts.get(w.passage_id) ?? 0) + 1);

  const rows = passages.map((p) => ({ ...p, wordCount: counts.get(p.id) ?? 0 }));

  return (
    <div>
      <AdminPageHeader
        title="Reading passages"
        description="Write a passage, then open it to add vocab."
      />

      <form action={createPassage} className="mb-6 space-y-3 rounded-lg border border-slate-200 p-4">
        <input
          name="title"
          placeholder="Passage title"
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <textarea
          name="body"
          placeholder="Passage text"
          required
          rows={6}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
        >
          Create passage
        </button>
      </form>

      <PassagesTable rows={rows} onDelete={deletePassage} />
    </div>
  );
}
