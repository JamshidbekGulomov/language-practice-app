import { adminList } from "@/lib/admin/crud";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

type NoteRow = {
  id: string;
  content: string;
  updated_at: string;
  profiles: { display_name: string | null; email: string } | null;
  listening_exam_tests: { title: string } | null;
};

export default async function AdminListeningExamNotesPage() {
  const notes = await adminList<NoteRow>("listening_exam_notes", {
    select: "id, content, updated_at, profiles(display_name, email), listening_exam_tests(title)",
    orderBy: "updated_at",
    ascending: false,
  });

  return (
    <div>
      <AdminPageHeader
        title="Student notes"
        description="Notes students took while listening to a full test, most recently updated first."
      />

      {notes.length === 0 ? (
        <p className="text-sm text-slate-400">No notes yet.</p>
      ) : (
        <div className="space-y-4">
          {notes
            .filter((n) => n.content.trim())
            .map((n) => (
              <div key={n.id} className="rounded-lg border border-slate-200 p-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-bold text-slate-900">
                    {n.profiles?.display_name || n.profiles?.email || "Unknown student"}
                  </span>
                  <span className="text-slate-400">{n.listening_exam_tests?.title}</span>
                </div>
                <p className="whitespace-pre-wrap text-sm text-slate-700">{n.content}</p>
                <p className="mt-2 text-xs text-slate-400">
                  Updated {new Date(n.updated_at).toLocaleString()}
                </p>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
