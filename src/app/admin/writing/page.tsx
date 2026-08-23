import Link from "next/link";
import { adminList } from "@/lib/admin/crud";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { LessonsTable } from "@/components/admin/writing/lessons-table";
import { createLesson, deleteLesson } from "@/app/admin/writing/actions";
import type { WritingLesson } from "@/lib/writing/types";

export default async function AdminWritingPage() {
  const lessons = await adminList<WritingLesson>("writing_lessons", {
    orderBy: "created_at",
    ascending: false,
  });

  return (
    <div>
      <AdminPageHeader
        title="Writing lessons"
        description="Each lesson explains a sentence structure via video, then attaches exercises."
        action={
          <Link
            href="/admin/writing/review"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Review submissions
          </Link>
        }
      />

      <form action={createLesson} className="mb-6 space-y-3 rounded-lg border border-slate-200 p-4">
        <input
          name="title"
          placeholder="Lesson title (e.g. Present Perfect)"
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          name="video_url"
          placeholder="Video link (YouTube unlisted, or a Telegram channel post)"
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <textarea
          name="description"
          placeholder="Description (optional)"
          rows={3}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-lg bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white transition hover:from-indigo-500 hover:to-fuchsia-500"
        >
          Create lesson
        </button>
      </form>

      <LessonsTable rows={lessons} onDelete={deleteLesson} />
    </div>
  );
}
