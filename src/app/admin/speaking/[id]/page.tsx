import { notFound } from "next/navigation";
import { adminList } from "@/lib/admin/crud";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { QuestionsTable } from "@/components/admin/speaking/questions-table";
import { HintsTable } from "@/components/admin/speaking/hints-table";
import { SpeakingHintUploadForm } from "@/components/admin/speaking/hint-upload-form";
import { ImagesManager } from "@/components/admin/speaking/images-manager";
import {
  updateTopicPrompt,
  addQuestion,
  deleteQuestion,
  addHint,
  deleteHint,
  deleteImage,
} from "@/app/admin/speaking/actions";
import { getPartDef, isSpeakingExam } from "@/lib/speaking/exams";
import type { SpeakingTopic, SpeakingQuestion, SpeakingHint, SpeakingImage } from "@/lib/speaking/types";

export default async function AdminSpeakingTopicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [topicRows, questions, hints, images] = await Promise.all([
    adminList<SpeakingTopic>("speaking_topics", { eq: { id } }),
    adminList<SpeakingQuestion>("speaking_questions", {
      eq: { topic_id: id },
      orderBy: "created_at",
      ascending: true,
    }),
    adminList<SpeakingHint>("speaking_hints", {
      eq: { topic_id: id },
      orderBy: "created_at",
      ascending: true,
    }),
    adminList<SpeakingImage>("speaking_images", {
      eq: { topic_id: id },
      orderBy: "position",
      ascending: true,
    }),
  ]);

  const topic = topicRows[0];
  if (!topic) notFound();

  const partDef = isSpeakingExam(topic.exam) ? getPartDef(topic.exam, topic.part) : undefined;

  return (
    <div>
      <AdminPageHeader
        title={topic.title}
        description={`${partDef?.label ?? topic.part} · ${partDef?.description ?? topic.format}`}
      />

      <form
        action={updateTopicPrompt.bind(null, id)}
        className="space-y-3 rounded-lg border border-slate-200 p-4"
      >
        <label className="text-sm font-medium text-slate-700">
          {topic.format === "cue_card" ? "Cue-card prompt" : "Prompt / instructions"}
        </label>
        <textarea
          name="prompt"
          defaultValue={topic.prompt}
          rows={3}
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
        >
          Save
        </button>
      </form>

      {topic.format === "images" && (
        <div className="mt-10">
          <h2 className="text-lg font-bold text-slate-900">Images</h2>
          <p className="mt-1 text-sm text-slate-500">
            {partDef?.imageCount ?? 1} image{(partDef?.imageCount ?? 1) === 1 ? "" : "s"} for this part.
          </p>
          <div className="mt-4">
            <ImagesManager
              topicId={id}
              images={images}
              cap={partDef?.imageCount ?? 1}
              onDelete={deleteImage.bind(null, id)}
            />
          </div>
        </div>
      )}

      {partDef?.questionCount !== 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-bold text-slate-900">
            {topic.format === "cue_card" ? "Guided questions" : "Questions"}
          </h2>
          {topic.format === "cue_card" && (
            <p className="mt-1 text-sm text-slate-500">
              Optional follow-up questions shown alongside the prompt.
            </p>
          )}
          {typeof partDef?.questionCount === "number" && partDef.questionCount > 0 && (
            <p className="mt-1 text-sm text-slate-500">
              {questions.length} of {partDef.questionCount} required.
            </p>
          )}
          {topic.format === "qa" && (
            <p className="mt-1 text-sm text-slate-500">
              Each question gets its own recording, self-check, and send-to-teacher.
            </p>
          )}

          {(typeof partDef?.questionCount !== "number" ||
            questions.length < partDef.questionCount) && (
            <form
              action={addQuestion.bind(null, id)}
              className="mt-3 flex gap-3 rounded-lg border border-slate-200 p-4"
            >
              <input
                name="question"
                placeholder="e.g. Why was it memorable?"
                required
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <button
                type="submit"
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
              >
                Add
              </button>
            </form>
          )}

          <div className="mt-4">
            <QuestionsTable rows={questions} onDelete={deleteQuestion.bind(null, id)} />
          </div>
        </div>
      )}

      <div className="mt-10">
        <h2 className="text-lg font-bold text-slate-900">Vocab hints</h2>
        <p className="mt-1 text-sm text-slate-500">
          Words students should try to use in their answer.
        </p>

        <form
          action={addHint.bind(null, id)}
          className="mt-3 grid grid-cols-1 gap-3 rounded-lg border border-slate-200 p-4 sm:grid-cols-2"
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

        <div className="mt-4">
          <SpeakingHintUploadForm topicId={id} />
        </div>

        <div className="mt-4">
          <HintsTable rows={hints} onDelete={deleteHint.bind(null, id)} />
        </div>
      </div>
    </div>
  );
}
