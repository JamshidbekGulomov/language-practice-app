import { adminList } from "@/lib/admin/crud";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { getSpeakingAudioUrl } from "@/lib/speaking/queries";
import { leaveFeedback } from "@/app/admin/speaking/actions";

type ReviewRow = {
  id: string;
  audio_path: string;
  teacher_feedback: string | null;
  created_at: string;
  profiles: { email: string; display_name: string | null } | null;
  speaking_topics: { title: string } | null;
};

export default async function AdminSpeakingReviewPage() {
  const rows = await adminList<ReviewRow>("speaking_submissions", {
    eq: { sent_to_teacher: true },
    select:
      "id, audio_path, teacher_feedback, created_at, profiles(email, display_name), speaking_topics(title)",
    orderBy: "created_at",
    ascending: false,
  });

  const rowsWithUrls = await Promise.all(
    rows.map(async (r) => ({ ...r, audio_url: await getSpeakingAudioUrl(r.audio_path) })),
  );

  return (
    <div>
      <AdminPageHeader
        title="Speaking review queue"
        description="Recordings students have sent for feedback."
      />

      {rowsWithUrls.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">
          Nothing to review right now.
        </p>
      ) : (
        <div className="space-y-4">
          {rowsWithUrls.map((r) => (
            <div key={r.id} className="rounded-lg border border-slate-200 p-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>
                  {r.speaking_topics?.title} · {r.profiles?.display_name ?? r.profiles?.email}
                </span>
                <span>{new Date(r.created_at).toLocaleDateString()}</span>
              </div>

              {r.audio_url ? (
                <audio controls src={r.audio_url} className="mt-2 w-full" />
              ) : (
                <p className="mt-2 text-sm text-red-600">Couldn&apos;t load this recording.</p>
              )}

              {r.teacher_feedback ? (
                <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                  Your feedback: {r.teacher_feedback}
                </p>
              ) : (
                <form action={leaveFeedback.bind(null, r.id)} className="mt-3 flex gap-2">
                  <input
                    name="teacher_feedback"
                    placeholder="Leave feedback…"
                    required
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                  >
                    Send
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
