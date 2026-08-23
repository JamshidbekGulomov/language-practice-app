import { notFound } from "next/navigation";
import { adminList } from "@/lib/admin/crud";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { NewSectionForm } from "@/components/admin/listening-exam/new-section-form";
import { getAudioPublicUrl } from "@/lib/listening/storage";
import { updateSectionTranscript, deleteSection } from "@/app/admin/listening-exam/actions";
import { EXAM_LABELS } from "@/lib/exam";
import type { ListeningExamTest, ListeningExamSection } from "@/lib/listening-exam/types";

/** Server Actions inherit the page's timeout — AI transcription can take longer than the platform default. */
export const maxDuration = 60;

export default async function AdminListeningExamTestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const tests = await adminList<ListeningExamTest>("listening_exam_tests", { eq: { id } });
  const test = tests[0];
  if (!test) notFound();

  const sections = await adminList<ListeningExamSection>("listening_exam_sections", {
    eq: { test_id: id },
    orderBy: "section_number",
    ascending: true,
  });

  const nextSectionNumber = Math.min(4, sections.length + 1);

  return (
    <div>
      <AdminPageHeader title={test.title} description={`${EXAM_LABELS[test.exam]} · Listening Exam`} />

      <div className="space-y-4">
        {sections.map((s) => (
          <div key={s.id} className="rounded-lg border border-slate-200 p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">
                Section {s.section_number} — {s.label}
              </h3>
              <form action={deleteSection.bind(null, s.id, id)}>
                <button type="submit" className="text-xs text-red-600 hover:underline">
                  Remove
                </button>
              </form>
            </div>
            <audio controls src={getAudioPublicUrl(s.audio_path)} className="w-full" />
            <form action={updateSectionTranscript.bind(null, s.id, id)} className="mt-3">
              <textarea
                name="transcript"
                defaultValue={s.transcript ?? ""}
                rows={4}
                placeholder="Transcript"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <button
                type="submit"
                className="mt-2 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
              >
                Save transcript
              </button>
            </form>
          </div>
        ))}
      </div>

      {sections.length < 4 && (
        <div className="mt-6">
          <NewSectionForm testId={id} nextSectionNumber={nextSectionNumber} />
        </div>
      )}
    </div>
  );
}
