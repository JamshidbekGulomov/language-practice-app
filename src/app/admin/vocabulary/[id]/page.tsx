import { notFound } from "next/navigation";
import { adminList } from "@/lib/admin/crud";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DataTable } from "@/components/admin/data-table";
import { WordUploadForm } from "@/components/admin/vocab/word-upload-form";
import { addWord, deleteWord } from "@/app/admin/vocabulary/actions";
import type { VocabCategory, VocabWord } from "@/lib/vocabulary/types";

export default async function AdminVocabCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [categoryRows, words] = await Promise.all([
    adminList<VocabCategory>("vocab_categories", { eq: { id } }),
    adminList<VocabWord>("vocab_words", {
      eq: { category_id: id },
      orderBy: "created_at",
      ascending: false,
    }),
  ]);

  const category = categoryRows[0];
  if (!category) notFound();

  return (
    <div>
      <AdminPageHeader title={category.name} description={`${words.length} word(s)`} />

      <WordUploadForm categoryId={id} />

      <form
        action={addWord.bind(null, id)}
        className="mt-6 grid grid-cols-1 gap-3 rounded-lg border border-slate-200 p-4 sm:grid-cols-2"
      >
        <input
          name="english"
          placeholder="English word"
          required
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          name="uzbek"
          placeholder="Uzbek translation"
          required
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          name="synonym"
          placeholder="Synonym (optional)"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          name="difficulty"
          placeholder="Difficulty (optional)"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          name="example_sentence"
          placeholder="Example sentence (optional)"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
        />
        <button
          type="submit"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 sm:col-span-2"
        >
          Add word
        </button>
      </form>

      <div className="mt-6">
        <DataTable
          columns={[
            { key: "english", label: "English" },
            { key: "uzbek", label: "Uzbek" },
            { key: "synonym", label: "Synonym", render: (w) => w.synonym ?? "—" },
            { key: "difficulty", label: "Difficulty", render: (w) => w.difficulty ?? "—" },
          ]}
          rows={words}
          onDelete={deleteWord.bind(null, id)}
          emptyMessage="No words yet — add one above or bulk upload a file."
        />
      </div>
    </div>
  );
}
