import { notFound } from "next/navigation";
import { adminList } from "@/lib/admin/crud";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ReadingWordsTable } from "@/components/admin/reading/reading-words-table";
import { ReadingWordUploadForm } from "@/components/admin/reading/word-upload-form";
import { addWord, deleteWord, updateBody } from "@/app/admin/reading/actions";
import type { ReadingPassage, ReadingWord } from "@/lib/reading/types";

export default async function AdminReadingPassagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [passageRows, words] = await Promise.all([
    adminList<ReadingPassage>("reading_passages", { eq: { id } }),
    adminList<ReadingWord>("reading_words", {
      eq: { passage_id: id },
      orderBy: "created_at",
      ascending: false,
    }),
  ]);

  const passage = passageRows[0];
  if (!passage) notFound();

  return (
    <div>
      <AdminPageHeader title={passage.title} description={`${words.length} word(s)`} />

      <form
        action={updateBody.bind(null, id)}
        className="rounded-lg border border-slate-200 p-4"
      >
        <label className="text-sm font-medium text-slate-700">Passage text</label>
        <textarea
          name="body"
          defaultValue={passage.body}
          required
          rows={10}
          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="mt-3 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
        >
          Save passage
        </button>
      </form>

      <div className="mt-6">
        <ReadingWordUploadForm passageId={id} />
      </div>

      <form
        action={addWord.bind(null, id)}
        className="mt-6 grid grid-cols-1 gap-3 rounded-lg border border-slate-200 p-4 sm:grid-cols-2"
      >
        <input
          name="word"
          placeholder="Word"
          required
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          name="meaning"
          placeholder="Meaning (optional)"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 sm:col-span-2"
        >
          Add word
        </button>
      </form>

      <div className="mt-6">
        <ReadingWordsTable rows={words} onDelete={deleteWord.bind(null, id)} />
      </div>
    </div>
  );
}
