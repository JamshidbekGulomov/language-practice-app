import { adminList } from "@/lib/admin/crud";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { NewClipForm } from "@/components/admin/listening/new-clip-form";
import { ClipsTable } from "@/components/admin/listening/clips-table";
import { deleteClip } from "@/app/admin/listening/actions";
import type { ListeningClip, ListeningWord } from "@/lib/listening/types";

export default async function AdminListeningPage() {
  const [clips, words] = await Promise.all([
    adminList<ListeningClip>("listening_clips", { orderBy: "created_at", ascending: false }),
    adminList<Pick<ListeningWord, "clip_id">>("listening_words", { select: "clip_id" }),
  ]);

  const counts = new Map<string, number>();
  for (const w of words) counts.set(w.clip_id, (counts.get(w.clip_id) ?? 0) + 1);

  const rows = clips.map((c) => ({ ...c, wordCount: counts.get(c.id) ?? 0 }));

  return (
    <div>
      <AdminPageHeader
        title="Listening clips"
        description="Upload an audio clip, then open it to add vocab and a transcript."
      />

      <NewClipForm />

      <div className="mt-6">
        <ClipsTable rows={rows} onDelete={deleteClip} />
      </div>
    </div>
  );
}
