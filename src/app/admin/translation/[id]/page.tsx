import { notFound } from "next/navigation";
import { adminList } from "@/lib/admin/crud";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { SentencesTable } from "@/components/admin/translation/sentences-table";
import { SentenceUploadForm } from "@/components/admin/translation/sentence-upload-form";
import { updateLevel, addSentence, deleteSentence } from "@/app/admin/translation/actions";
import type { TranslationLevel, TranslationSentence } from "@/lib/translation/types";

export default async function AdminTranslationLevelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [levelRows, sentences] = await Promise.all([
    adminList<TranslationLevel>("translation_levels", { eq: { id } }),
    adminList<TranslationSentence>("translation_sentences", {
      eq: { level_id: id },
      orderBy: "created_at",
      ascending: true,
    }),
  ]);

  const level = levelRows[0];
  if (!level) notFound();

  return (
    <div>
      <AdminPageHeader title={level.title} />

      <form
        action={updateLevel.bind(null, id)}
        className="space-y-3 rounded-lg border border-slate-200 p-4"
      >
        <label className="text-sm font-medium text-slate-700">Description</label>
        <textarea
          name="description"
          defaultValue={level.description ?? ""}
          rows={3}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
        >
          Save
        </button>
      </form>

      <div className="mt-10">
        <h2 className="text-lg font-bold text-slate-900">Sentences</h2>
        <p className="mt-1 text-sm text-slate-500">
          Give students an Uzbek sentence to translate into English.
        </p>

        <form
          action={addSentence.bind(null, id)}
          className="mt-3 grid grid-cols-1 gap-3 rounded-lg border border-slate-200 p-4 sm:grid-cols-2"
        >
          <input
            name="uzbek_text"
            placeholder="Uzbek sentence"
            required
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            name="model_answer"
            placeholder="Model answer (optional)"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 sm:col-span-2"
          >
            Add sentence
          </button>
        </form>

        <div className="mt-4">
          <SentenceUploadForm levelId={id} />
        </div>

        <div className="mt-4">
          <SentencesTable rows={sentences} onDelete={deleteSentence.bind(null, id)} />
        </div>
      </div>
    </div>
  );
}
