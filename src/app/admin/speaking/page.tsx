import Link from "next/link";
import { adminList } from "@/lib/admin/crud";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { TopicsTable } from "@/components/admin/speaking/topics-table";
import { createTopic, deleteTopic } from "@/app/admin/speaking/actions";
import type { SpeakingTopic } from "@/lib/speaking/types";

export default async function AdminSpeakingPage() {
  const topics = await adminList<SpeakingTopic>("speaking_topics", {
    orderBy: "created_at",
    ascending: false,
  });

  return (
    <div>
      <AdminPageHeader
        title="Speaking topics"
        description="Each topic gives students a cue-card prompt, guided questions, and vocab hints to record an answer against."
        action={
          <Link
            href="/admin/speaking/review"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Review submissions
          </Link>
        }
      />

      <form action={createTopic} className="mb-6 space-y-3 rounded-lg border border-slate-200 p-4">
        <input
          name="title"
          placeholder="Topic title (e.g. Describe a memorable trip)"
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <textarea
          name="prompt"
          placeholder="Cue-card prompt / instructions"
          rows={3}
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
        >
          Create topic
        </button>
      </form>

      <TopicsTable rows={topics} onDelete={deleteTopic} />
    </div>
  );
}
