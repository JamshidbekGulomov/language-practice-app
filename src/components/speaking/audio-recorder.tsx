"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createUploadUrl, submitRecording, analyzeSubmission } from "@/app/speaking/actions";
import { SPEAKING_AUDIO_BUCKET } from "@/lib/speaking/storage";

type Status = "idle" | "prep" | "recording" | "recorded" | "uploading" | "analyzing";

function pickExtension(mimeType: string): string {
  if (mimeType.includes("mp4")) return "m4a";
  if (mimeType.includes("ogg")) return "ogg";
  return "webm";
}

/**
 * Handles all three Speaking practice mechanics via optional timer props:
 * plain record-once (images format, per-question qa turns — no props),
 * or a cue-card take with silent prep then an auto-stopping timed
 * recording (prepSeconds + maxSeconds).
 */
export function AudioRecorder({
  topicId,
  topicPath,
  questionId,
  prepSeconds,
  maxSeconds,
}: {
  topicId: string;
  topicPath: string;
  questionId?: string;
  prepSeconds?: number;
  maxSeconds?: number;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const blobRef = useRef<Blob | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function clearTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  useEffect(() => clearTimer, []);

  async function beginRecording() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        blobRef.current = blob;
        setPreviewUrl(URL.createObjectURL(blob));
        setStatus("recorded");
        clearTimer();
        setSecondsLeft(null);
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start();
      recorderRef.current = recorder;
      setStatus("recording");

      if (maxSeconds) {
        setSecondsLeft(maxSeconds);
        timerRef.current = setInterval(() => {
          setSecondsLeft((s) => {
            if (s !== null && s <= 1) {
              clearTimer();
              recorderRef.current?.stop();
              return 0;
            }
            return s === null ? null : s - 1;
          });
        }, 1000);
      }
    } catch {
      setError("Couldn't access your microphone. Check your browser permissions.");
      setStatus("idle");
    }
  }

  function start() {
    if (prepSeconds) {
      setStatus("prep");
      setSecondsLeft(prepSeconds);
      timerRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s !== null && s <= 1) {
            clearTimer();
            beginRecording();
            return 0;
          }
          return s === null ? null : s - 1;
        });
      }, 1000);
    } else {
      beginRecording();
    }
  }

  function stopRecording() {
    recorderRef.current?.stop();
  }

  function reRecord() {
    setPreviewUrl(null);
    blobRef.current = null;
    setStatus("idle");
  }

  async function submit() {
    const blob = blobRef.current;
    if (!blob) return;
    setStatus("uploading");
    setError(null);
    try {
      const extension = pickExtension(blob.type);
      const { path, token } = await createUploadUrl(extension);
      const { error: uploadError } = await supabase.storage
        .from(SPEAKING_AUDIO_BUCKET)
        .uploadToSignedUrl(path, token, blob);
      if (uploadError) throw new Error(uploadError.message);

      const submissionId = await submitRecording(topicId, topicPath, path, questionId);

      setStatus("analyzing");
      await analyzeSubmission(topicPath, submissionId);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setStatus("recorded");
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 p-4">
      {status === "idle" && (
        <button
          onClick={start}
          className="rounded-lg bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white transition hover:from-indigo-500 hover:to-fuchsia-500"
        >
          {prepSeconds ? `Start (${prepSeconds}s to prepare)` : "Start recording"}
        </button>
      )}

      {status === "prep" && (
        <div className="text-center">
          <p className="text-sm font-medium text-slate-600">Prepare your answer…</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{secondsLeft}s</p>
        </div>
      )}

      {status === "recording" && (
        <div className="space-y-3 text-center">
          {secondsLeft !== null && (
            <p className="text-sm font-medium text-slate-600">{secondsLeft}s remaining</p>
          )}
          <button
            onClick={stopRecording}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
          >
            Stop recording
          </button>
        </div>
      )}

      {(status === "recorded" || status === "uploading" || status === "analyzing") && previewUrl && (
        <div className="space-y-3">
          <audio controls src={previewUrl} className="w-full" />
          <div className="flex gap-2">
            <button
              onClick={submit}
              disabled={status !== "recorded"}
              className="rounded-lg bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white transition hover:from-indigo-500 hover:to-fuchsia-500 disabled:opacity-50"
            >
              {status === "uploading"
                ? "Submitting…"
                : status === "analyzing"
                  ? "Analyzing…"
                  : "Submit recording"}
            </button>
            <button
              onClick={reRecord}
              disabled={status !== "recorded"}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              Re-record
            </button>
          </div>
        </div>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
