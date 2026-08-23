import { AudioRecorder } from "@/components/speaking/audio-recorder";
import { SubmissionPanel } from "@/components/speaking/submission-panel";
import type { SpeakingQuestion, SpeakingSubmission } from "@/lib/speaking/types";

/** One question at a time, each with its own recording + self-check + send-to-teacher — mirrors the Writing module's per-prompt submission flow. */
export function QaPractice({
  topicId,
  topicPath,
  questions,
  submissions,
  onMarkSelfChecked,
  onSendToTeacher,
}: {
  topicId: string;
  topicPath: string;
  questions: SpeakingQuestion[];
  submissions: Record<string, SpeakingSubmission & { audio_url: string | null }>;
  onMarkSelfChecked: (submissionId: string) => Promise<void>;
  onSendToTeacher: (submissionId: string) => Promise<void>;
}) {
  if (questions.length === 0) {
    return <p className="text-sm text-slate-500">No questions yet — check back soon.</p>;
  }

  return (
    <div className="space-y-6">
      {questions.map((q, i) => {
        const submission = submissions[q.id];
        return (
          <div key={q.id}>
            <p className="mb-2 text-sm font-medium text-slate-700">
              {i + 1}. {q.question}
            </p>
            {submission ? (
              <SubmissionPanel
                submission={submission}
                onMarkSelfChecked={onMarkSelfChecked}
                onSendToTeacher={onSendToTeacher}
              />
            ) : (
              <AudioRecorder topicId={topicId} topicPath={topicPath} questionId={q.id} />
            )}
          </div>
        );
      })}
    </div>
  );
}
