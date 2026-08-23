"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { createImageUploadUrl, addImage } from "@/app/admin/speaking/actions";
import { SPEAKING_IMAGES_BUCKET, getSpeakingImageUrl } from "@/lib/speaking/storage";
import type { SpeakingImage } from "@/lib/speaking/types";

export function ImagesManager({
  topicId,
  images,
  cap,
  onDelete,
}: {
  topicId: string;
  images: SpeakingImage[];
  cap: number;
  onDelete: (id: string) => Promise<void>;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const atCap = images.length >= cap;

  function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("That file isn't an image.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const { path, token } = await createImageUploadUrl(file.name);
        const { error: uploadError } = await supabase.storage
          .from(SPEAKING_IMAGES_BUCKET)
          .uploadToSignedUrl(path, token, file);
        if (uploadError) throw new Error(uploadError.message);

        await addImage(topicId, path);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      }
    });
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    if (atCap || isPending) return;
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function handlePaste(e: React.ClipboardEvent<HTMLDivElement>) {
    if (atCap || isPending) return;
    const item = Array.from(e.clipboardData.items).find((i) => i.type.startsWith("image/"));
    const file = item?.getAsFile();
    if (file) handleFile(file);
  }

  return (
    <div className="space-y-4">
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {images.map((img) => (
            <div
              key={img.id}
              className="group relative overflow-hidden rounded-lg border border-slate-200"
            >
              <Image
                src={getSpeakingImageUrl(img.image_path)}
                alt=""
                width={200}
                height={200}
                className="h-32 w-full object-cover"
              />
              <button
                onClick={() =>
                  startTransition(async () => {
                    await onDelete(img.id);
                    router.refresh();
                  })
                }
                disabled={isPending}
                className="absolute right-1 top-1 rounded-md bg-white/90 px-2 py-1 text-xs font-medium text-red-600 opacity-0 shadow group-hover:opacity-100 disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {!atCap && (
        <div
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onPaste={handlePaste}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-8 text-center transition ${
            isDragging ? "border-slate-900 bg-slate-50" : "border-slate-300 hover:border-slate-400"
          }`}
        >
          <p className="text-sm font-medium text-slate-600">
            Click to upload, drag and drop, or paste a screenshot
          </p>
          <p className="mt-1 text-xs text-slate-400">PNG, JPG, or GIF</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            disabled={isPending}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
            className="hidden"
          />
        </div>
      )}
      {atCap && (
        <p className="text-xs text-slate-500">
          Maximum of {cap} image{cap === 1 ? "" : "s"} reached.
        </p>
      )}
      {isPending && <p className="text-xs text-slate-500">Uploading…</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
