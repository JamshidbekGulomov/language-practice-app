import { adminList } from "@/lib/admin/crud";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { VocabCategoriesTable } from "@/components/admin/vocab/vocab-categories-table";
import { createCategory, deleteCategory } from "@/app/admin/vocabulary/actions";
import type { VocabCategory, VocabWord } from "@/lib/vocabulary/types";

export default async function AdminVocabularyPage() {
  const [categories, words] = await Promise.all([
    adminList<VocabCategory>("vocab_categories", { orderBy: "created_at", ascending: false }),
    adminList<Pick<VocabWord, "category_id">>("vocab_words", { select: "category_id" }),
  ]);

  const counts = new Map<string, number>();
  for (const w of words) counts.set(w.category_id, (counts.get(w.category_id) ?? 0) + 1);

  const rows = categories.map((c) => ({ ...c, wordCount: counts.get(c.id) ?? 0 }));

  return (
    <div>
      <AdminPageHeader
        title="Vocabulary categories"
        description="Create categories, then open one to bulk-upload or add words."
      />

      <form
        action={createCategory}
        className="mb-6 flex gap-2 rounded-lg border border-slate-200 p-4"
      >
        <input
          name="name"
          placeholder="Category name (e.g. Business)"
          required
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-lg bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white transition hover:from-indigo-500 hover:to-fuchsia-500"
        >
          Create
        </button>
      </form>

      <VocabCategoriesTable rows={rows} onDelete={deleteCategory} />
    </div>
  );
}
