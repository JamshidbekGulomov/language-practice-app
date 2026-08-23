import { notFound } from "next/navigation";
import { adminList } from "@/lib/admin/crud";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { GapFillTable } from "@/components/admin/writing/gap-fill-table";
import { SentencePromptsTable } from "@/components/admin/writing/sentence-prompts-table";
import {
  updateLesson,
  addGapFillExercise,
  deleteGapFillExercise,
  addSentencePrompt,
  deleteSentencePrompt,
} from "@/app/admin/writing/actions";
import type { WritingLesson, GapFillExercise, SentencePrompt } from "@/lib/writing/types";

export default async function AdminWritingLessonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [lessonRows, gapFill, sentencePrompts] = await Promise.all([
    adminList<WritingLesson>("writing_lessons", { eq: { id } }),
    adminList<GapFillExercise>("writing_gap_fill_exercises", {
      eq: { lesson_id: id },
      orderBy: "created_at",
      ascending: true,
    }),
    adminList<SentencePrompt>("writing_sentence_prompts", {
      eq: { lesson_id: id },
      orderBy: "created_at",
      ascending: true,
    }),
  ]);

  const lesson = lessonRows[0];
  if (!lesson) notFound();

  return (
    <div>
      <AdminPageHeader title={lesson.title} />

      <form
        action={updateLesson.bind(null, id)}
        className="space-y-3 rounded-lg border border-slate-200 p-4"
      >
        <label className="text-sm font-medium text-slate-700">YouTube link</label>
        <input
          name="youtube_url"
          defaultValue={lesson.youtube_url}
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <label className="text-sm font-medium text-slate-700">Description</label>
        <textarea
          name="description"
          defaultValue={lesson.description ?? ""}
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
        <h2 className="text-lg font-bold text-slate-900">Gap-fill exercises</h2>
        <p className="mt-1 text-sm text-slate-500">
          Use <code className="rounded bg-slate-100 px-1">___</code> in the prompt to mark the
          blank.
        </p>

        <form
          action={addGapFillExercise.bind(null, id)}
          className="mt-3 grid grid-cols-1 gap-3 rounded-lg border border-slate-200 p-4 sm:grid-cols-2"
        >
          <input
            name="prompt"
            placeholder="I ___ to school every day."
            required
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            name="answer"
            placeholder="Answer (e.g. go)"
            required
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
          <GapFillTable rows={gapFill} onDelete={deleteGapFillExercise.bind(null, id)} />
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-bold text-slate-900">Sentence construction prompts</h2>
        <p className="mt-1 text-sm text-slate-500">
          Give students words to build an original sentence with.
        </p>

        <form
          action={addSentencePrompt.bind(null, id)}
          className="mt-3 grid grid-cols-1 gap-3 rounded-lg border border-slate-200 p-4 sm:grid-cols-2"
        >
          <input
            name="words"
            placeholder="Words (e.g. although / weather)"
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
            Add prompt
          </button>
        </form>

        <div className="mt-4">
          <SentencePromptsTable
            rows={sentencePrompts}
            onDelete={deleteSentencePrompt.bind(null, id)}
          />
        </div>
      </div>
    </div>
  );
}
