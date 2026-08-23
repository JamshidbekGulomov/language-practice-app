"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { SentencePrompt, SentenceSubmission } from "@/lib/writing/types";

function PromptCard({
  prompt,
  submission,
  onSubmit,
  onMarkSelfChecked,
  onSendToTeacher,
}: {
  prompt: SentencePrompt;
  submission: SentenceSubmission | undefined;
  onSubmit: (promptId: string, text: string) => Promise<void>;
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
        <p className="text-sm font-medium text-slate-700">
          Use: <span className="font-semibold text-slate-900">{prompt.words}</span>
        </p>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={2}
          placeholder="Write your sentence…"
          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          disabled={isPending || !draft.trim()}
          onClick={() =>
            startTransition(async () => {
              await onSubmit(prompt.id, draft);
              router.refresh();
            })
          }
          className="mt-2 rounded-lg bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white transition hover:from-indigo-500 hover:to-fuchsia-500 disabled:opacity-50"
        >
          {isPending ? "Submitting…" : "Submit"}
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <p className="text-sm font-medium text-slate-700">
        Use: <span className="font-semibold text-slate-900">{prompt.words}</span>
      </p>
      <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-800">
        {submission.submission}
      </p>

      {prompt.model_answer && (
        <div className="mt-2">
          {showModel ? (
            <p className="text-sm text-slate-500">Model answer: {prompt.model_answer}</p>
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
  prompts,
  submissions,
  onSubmit,
  onMarkSelfChecked,
  onSendToTeacher,
}: {
  prompts: SentencePrompt[];
  submissions: Record<string, SentenceSubmission>;
  onSubmit: (promptId: string, text: string) => Promise<void>;
  onMarkSelfChecked: (submissionId: string) => Promise<void>;
  onSendToTeacher: (submissionId: string) => Promise<void>;
}) {
  if (prompts.length === 0) {
    return <p className="text-sm text-slate-500">No sentence prompts yet.</p>;
  }

  return (
    <div className="space-y-3">
      {prompts.map((p) => (
        <PromptCard
          key={p.id}
          prompt={p}
          submission={submissions[p.id]}
          onSubmit={onSubmit}
          onMarkSelfChecked={onMarkSelfChecked}
          onSendToTeacher={onSendToTeacher}
        />
      ))}
    </div>
  );
}
