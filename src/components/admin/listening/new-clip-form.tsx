"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createUploadUrl, createClip } from "@/app/admin/listening/actions";
import { LISTENING_AUDIO_BUCKET } from "@/lib/listening/storage";

export function NewClipForm() {
  const router = useRouter();
  const supabase = createClient();
  const [isPending, startTransition] = useTransition();
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const title = (formData.get("title") as string)?.trim();
    const transcript = (formData.get("transcript") as string) ?? "";
    const exam = (formData.get("exam") as string) ?? "";
    const fileInput = form.elements.namedItem("audio") as HTMLInputElement;
    const file = fileInput.files?.[0];

    if (!title) {
      setError("Title is required");
      return;
    }
    if (!file) {
      setError("Please choose an audio file");
      return;
    }

    startTransition(async () => {
      try {
        setProgress("Uploading audio…");
        const { path, token } = await createUploadUrl(file.name);
        const { error: uploadError } = await supabase.storage
          .from(LISTENING_AUDIO_BUCKET)
          .uploadToSignedUrl(path, token, file);
        if (uploadError) throw new Error(uploadError.message);

        setProgress("Saving…");
        const fd = new FormData();
        fd.set("title", title);
        fd.set("audio_path", path);
        fd.set("transcript", transcript);
        fd.set("exam", exam);
        await createClip(fd);

        form.reset();
        setProgress(null);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
        setProgress(null);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-slate-200 p-4">
      <input
        name="title"
        placeholder="Clip title"
        required
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      <input
        name="audio"
        type="file"
        accept="audio/*"
        required
        className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white hover:file:bg-indigo-500"
      />
      <textarea
        name="transcript"
        placeholder="Transcript (optional)"
        rows={4}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      <select
        name="exam"
        defaultValue=""
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
      >
        <option value="">General English</option>
        <option value="ielts">IELTS</option>
        <option value="cefr">CEFR</option>
      </select>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white transition hover:from-indigo-500 hover:to-fuchsia-500 disabled:opacity-50"
      >
        {isPending ? (progress ?? "Working…") : "Create clip"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
