import { adminList } from "@/lib/admin/crud";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { NewTestForm } from "@/components/admin/reading-exam/new-test-form";
import { TestsTable } from "@/components/admin/reading-exam/tests-table";
import { deleteTest } from "@/app/admin/reading-exam/actions";
import type { ReadingExamTest } from "@/lib/reading-exam/types";

export default async function AdminReadingExamPage() {
  const tests = await adminList<ReadingExamTest>("reading_exam_tests", {
    orderBy: "created_at",
    ascending: false,
  });

  return (
    <div>
      <AdminPageHeader
        title="Reading Exam"
        description="Computer-delivered style reading tests: three passages plus a full exam, for IELTS and CEFR."
      />

      <NewTestForm />

      <div className="mt-6">
        <TestsTable rows={tests} onDelete={deleteTest} />
      </div>
    </div>
  );
}
