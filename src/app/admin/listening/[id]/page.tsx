import { notFound } from "next/navigation";
import { adminList } from "@/lib/admin/crud";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ListeningWordsTable } from "@/components/admin/listening/listening-words-table";
import { ListeningWordUploadForm } from "@/components/admin/listening/word-upload-form";
import { getAudioPublicUrl } from "@/lib/listening/storage";
import { addWord, deleteWord, updateTranscript } from "@/app/admin/listening/actions";
import type { ListeningClip, ListeningWord } from "@/lib/listening/types";

export default async function AdminListeningClipPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [clipRows, words] = await Promise.all([
    adminList<ListeningClip>("listening_clips", { eq: { id } }),
    adminList<ListeningWord>("listening_words", {
      eq: { clip_id: id },
      orderBy: "created_at",
      ascending: false,
    }),
  ]);

  const clip = clipRows[0];
  if (!clip) notFound();

  return (
    <div>
      <AdminPageHeader title={clip.title} description={`${words.length} word(s)`} />

      <audio controls src={getAudioPublicUrl(clip.audio_path)} className="w-full" />

      <form
        action={updateTranscript.bind(null, id)}
        className="mt-6 rounded-lg border border-slate-200 p-4"
      >
        <label className="text-sm font-medium text-slate-700">Transcript</label>
        <textarea
          name="transcript"
          defaultValue={clip.transcript ?? ""}
          rows={6}
          placeholder="Optional — needed for the fill-in-the-blank game"
          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="mt-3 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
        >
          Save transcript
        </button>
      </form>

      <div className="mt-6">
        <ListeningWordUploadForm clipId={id} />
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
        <ListeningWordsTable rows={words} onDelete={deleteWord.bind(null, id)} />
      </div>
    </div>
  );
}
