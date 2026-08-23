"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { TranslationSentence, TranslationSubmission } from "@/lib/translation/types";

function SentenceCard({
  sentence,
  submission,
  onSubmit,
  onMarkSelfChecked,
  onSendToTeacher,
}: {
  sentence: TranslationSentence;
  submission: TranslationSubmission | undefined;
  onSubmit: (sentenceId: string, text: string) => Promise<void>;
  onMarkSelfChecked: (submissionId: string) => Promise<void>;
  onSendToTeacher: (submissionId: string) => Promise<void>;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const [showModel, setShowModel] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!submission) {
    return (
      <div className="rounded-lg border border-slate-200 p-4">
        <p className="text-sm font-medium text-slate-900">{sentence.uzbek_text}</p>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={2}
          placeholder="Translate into English…"
          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          disabled={isPending || !draft.trim()}
          onClick={() =>
            startTransition(async () => {
              await onSubmit(sentence.id, draft);
              router.refresh();
            })
          }
          className="mt-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {isPending ? "Submitting…" : "Submit"}
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <p className="text-sm font-medium text-slate-900">{sentence.uzbek_text}</p>
      <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-800">
        {submission.submission}
      </p>

      {sentence.model_answer && (
        <div className="mt-2">
          {showModel ? (
            <p className="text-sm text-slate-500">Model answer: {sentence.model_answer}</p>
          ) : (
            <button
              onClick={() => setShowModel(true)}
              className="text-xs font-medium text-sky-600 hover:underline"
            >
              Show model answer
            </button>
          )}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
        {submission.self_checked ? (
          <span className="text-emerald-600">✓ Self-checked</span>
        ) : (
          <button
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await onMarkSelfChecked(submission.id);
                router.refresh();
              })
            }
            className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-50"
          >
            Mark as self-checked
          </button>
        )}

        {submission.sent_to_teacher ? (
          <span className="text-sky-600">✓ Sent to teacher</span>
        ) : (
          <button
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await onSendToTeacher(submission.id);
                router.refresh();
              })
            }
            className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-50"
          >
            Send to teacher
          </button>
        )}
      </div>

      {submission.teacher_feedback && (
        <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Teacher feedback: {submission.teacher_feedback}
        </p>
      )}
    </div>
  );
}

export function SentenceExercises({
  sentences,
  submissions,
  onSubmit,
  onMarkSelfChecked,
  onSendToTeacher,
}: {
  sentences: TranslationSentence[];
  submissions: Record<string, TranslationSubmission>;
  onSubmit: (sentenceId: string, text: string) => Promise<void>;
  onMarkSelfChecked: (submissionId: string) => Promise<void>;
  onSendToTeacher: (submissionId: string) => Promise<void>;
}) {
  if (sentences.length === 0) {
    return <p className="text-sm text-slate-500">No sentences yet.</p>;
  }

  return (
    <div className="space-y-3">
      {sentences.map((s) => (
        <SentenceCard
          key={s.id}
          sentence={s}
          submission={submissions[s.id]}
          onSubmit={onSubmit}
          onMarkSelfChecked={onMarkSelfChecked}
          onSendToTeacher={onSendToTeacher}
        />
      ))}
    </div>
  );
}
