import { adminList } from "@/lib/admin/crud";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { leaveFeedback } from "@/app/admin/translation/actions";

type ReviewRow = {
  id: string;
  submission: string;
  teacher_feedback: string | null;
  created_at: string;
  profiles: { email: string; display_name: string | null } | null;
  translation_sentences: { uzbek_text: string; model_answer: string | null } | null;
  translation_levels: { title: string } | null;
};

export default async function AdminTranslationReviewPage() {
  const rows = await adminList<ReviewRow>("translation_submissions", {
    eq: { sent_to_teacher: true },
    select:
      "id, submission, teacher_feedback, created_at, profiles(email, display_name), translation_sentences(uzbek_text, model_answer), translation_levels(title)",
    orderBy: "created_at",
    ascending: false,
  });

  return (
    <div>
      <AdminPageHeader
        title="Translation review queue"
        description="Submissions students have sent for feedback."
      />

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">
          Nothing to review right now.
        </p>
      ) : (
        <div className="space-y-4">
          {rows.map((r) => (
            <div key={r.id} className="rounded-lg border border-slate-200 p-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>
                  {r.translation_levels?.title} · {r.profiles?.display_name ?? r.profiles?.email}
                </span>
                <span>{new Date(r.created_at).toLocaleDateString()}</span>
              </div>
              <p className="mt-2 text-sm text-slate-500">
                Uzbek:{" "}
                <span className="font-medium text-slate-700">
                  {r.translation_sentences?.uzbek_text}
                </span>
              </p>
              <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-800">
                {r.submission}
              </p>

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
