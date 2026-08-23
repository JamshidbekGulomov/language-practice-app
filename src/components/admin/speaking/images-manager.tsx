"use client";

import { useState, useTransition } from "react";
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

  const atCap = images.length >= cap;

  function handleFile(file: File) {
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
        <input
          type="file"
          accept="image/*"
          disabled={isPending}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
          className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-700"
        />
      )}
      {atCap && (
        <p className="text-xs text-slate-500">
          Maximum of {cap} image{cap === 1 ? "" : "s"} reached.
        </p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
