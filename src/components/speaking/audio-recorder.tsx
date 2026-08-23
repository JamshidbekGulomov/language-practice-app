"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createUploadUrl, submitRecording } from "@/app/speaking/actions";
import { SPEAKING_AUDIO_BUCKET } from "@/lib/speaking/storage";

type Status = "idle" | "recording" | "recorded" | "uploading";

function pickExtension(mimeType: string): string {
  if (mimeType.includes("mp4")) return "m4a";
  if (mimeType.includes("ogg")) return "ogg";
  return "webm";
}

export function AudioRecorder({ topicId, topicPath }: { topicId: string; topicPath: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const blobRef = useRef<Blob | null>(null);

  async function startRecording() {
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
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start();
      recorderRef.current = recorder;
      setStatus("recording");
    } catch {
      setError("Couldn't access your microphone. Check your browser permissions.");
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

      await submitRecording(topicId, topicPath, path);
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
          onClick={startRecording}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
        >
          Start recording
        </button>
      )}

      {status === "recording" && (
        <button
          onClick={stopRecording}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500"
        >
          Stop recording
        </button>
      )}

      {(status === "recorded" || status === "uploading") && previewUrl && (
        <div className="space-y-3">
          <audio controls src={previewUrl} className="w-full" />
          <div className="flex gap-2">
            <button
              onClick={submit}
              disabled={status === "uploading"}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {status === "uploading" ? "Submitting…" : "Submit recording"}
            </button>
            <button
              onClick={reRecord}
              disabled={status === "uploading"}
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
