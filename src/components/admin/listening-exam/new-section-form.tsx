"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createUploadUrl, addSection, transcribeUploadedAudio } from "@/app/admin/listening-exam/actions";
import { LISTENING_AUDIO_BUCKET } from "@/lib/listening/storage";

export function NewSectionForm({ testId, nextSectionNumber }: { testId: string; nextSectionNumber: number }) {
  const router = useRouter();
  const supabase = createClient();
  const [isPending, startTransition] = useTransition();
  const [aiPending, setAiPending] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState("");
  const uploadedPathRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function ensureUploaded(): Promise<string> {
    if (uploadedPathRef.current) return uploadedPathRef.current;
    const file = fileInputRef.current?.files?.[0];
    if (!file) throw new Error("Please choose an audio file");

    const { path, token } = await createUploadUrl(file.name);
    const { error: uploadError } = await supabase.storage.from(LISTENING_AUDIO_BUCKET).uploadToSignedUrl(path, token, file);
    if (uploadError) throw new Error(uploadError.message);
    uploadedPathRef.current = path;
    return path;
  }

  async function handleAutoTranscribe() {
    setError(null);
    setAiPending(true);
    try {
      setProgress("Uploading audio…");
      const path = await ensureUploaded();
      setProgress("Transcribing with AI…");
      const text = await transcribeUploadedAudio(path);
      setTranscript(text || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transcription failed");
    } finally {
      setAiPending(false);
      setProgress(null);
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const label = (formData.get("label") as string)?.trim();
    const sectionNumber = (formData.get("section_number") as string) ?? "";

    if (!label) {
      setError("Label is required");
      return;
    }

    startTransition(async () => {
      try {
        setProgress("Uploading audio…");
        const path = await ensureUploaded();

        setProgress("Saving…");
        const fd = new FormData();
        fd.set("section_number", sectionNumber);
        fd.set("label", label);
        fd.set("audio_path", path);
        fd.set("transcript", transcript);
        await addSection(testId, fd);

        form.reset();
        setTranscript("");
        uploadedPathRef.current = null;
        setProgress(null);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
        setProgress(null);
      }
    });
  }

  const busy = isPending || aiPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-slate-200 p-4">
      <div className="flex gap-3">
        <select
          name="section_number"
          defaultValue={String(nextSectionNumber)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          {[1, 2, 3, 4].map((n) => (
            <option key={n} value={n}>
              Section {n}
            </option>
          ))}
        </select>
        <input
          name="label"
          placeholder="Label, e.g. Part 1"
          required
          defaultValue={`Part ${nextSectionNumber}`}
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <input
        ref={fileInputRef}
        name="audio"
        type="file"
        accept="audio/*"
        required
        onChange={() => {
          uploadedPathRef.current = null;
        }}
        className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white hover:file:bg-indigo-500"
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleAutoTranscribe}
          disabled={busy}
          className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-purple-500 disabled:opacity-50"
        >
          🤖 Auto-transcribe with AI
        </button>
        <span className="text-xs text-slate-400">Uploads the audio (if needed), then fills the transcript below</span>
      </div>
      <textarea
        value={transcript}
        onChange={(e) => setTranscript(e.target.value)}
        placeholder="Transcript (optional) — review and correct any AI transcription before saving"
        rows={4}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={busy}
        className="rounded-lg bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white transition hover:from-indigo-500 hover:to-fuchsia-500 disabled:opacity-50"
      >
        {busy ? (progress ?? "Working…") : "Add section"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
