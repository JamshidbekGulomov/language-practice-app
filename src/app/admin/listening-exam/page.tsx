import Link from "next/link";
import { adminList } from "@/lib/admin/crud";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { NewListeningTestForm } from "@/components/admin/listening-exam/new-test-form";
import { ListeningTestsTable } from "@/components/admin/listening-exam/tests-table";
import { deleteTest } from "@/app/admin/listening-exam/actions";
import type { ListeningExamTest } from "@/lib/listening-exam/types";

export default async function AdminListeningExamPage() {
  const tests = await adminList<ListeningExamTest>("listening_exam_tests", {
    orderBy: "created_at",
    ascending: false,
  });

  return (
    <div>
      <AdminPageHeader
        title="Listening Exam"
        description="Full listening tests (up to 4 sections) for IELTS and CEFR — students listen, read the transcript, and take notes."
        action={
          <Link
            href="/admin/listening-exam/notes"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            View student notes
          </Link>
        }
      />

      <NewListeningTestForm />

      <div className="mt-6">
        <ListeningTestsTable rows={tests} onDelete={deleteTest} />
      </div>
    </div>
  );
}
