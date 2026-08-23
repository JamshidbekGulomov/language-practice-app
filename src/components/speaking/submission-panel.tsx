"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { SpeakingSubmission } from "@/lib/speaking/types";

export function SubmissionPanel({
  submission,
  onMarkSelfChecked,
  onSendToTeacher,
}: {
  submission: SpeakingSubmission & { audio_url: string | null };
  onMarkSelfChecked: (submissionId: string) => Promise<void>;
  onSendToTeacher: (submissionId: string) => Promise<void>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="rounded-lg border border-slate-200 p-4">
      {submission.audio_url ? (
        <audio controls src={submission.audio_url} className="w-full" />
      ) : (
        <p className="text-sm text-red-600">Couldn&apos;t load this recording.</p>
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

      {(submission.ai_transcript || submission.ai_feedback) && (
        <div className="mt-3 space-y-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            AI first pass (not a substitute for your teacher)
          </p>
          {submission.ai_transcript && (
            <p>
              <span className="font-medium text-slate-500">Transcript: </span>
              {submission.ai_transcript}
            </p>
          )}
          {submission.ai_feedback && (
            <p>
              <span className="font-medium text-slate-500">Feedback: </span>
              {submission.ai_feedback}
            </p>
          )}
        </div>
      )}

      {submission.teacher_feedback && (
        <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Teacher feedback: {submission.teacher_feedback}
        </p>
      )}
    </div>
  );
}
