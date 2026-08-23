import Link from "next/link";
import { adminList } from "@/lib/admin/crud";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { TopicForm } from "@/components/admin/speaking/topic-form";
import { TopicsTable } from "@/components/admin/speaking/topics-table";
import { deleteTopic } from "@/app/admin/speaking/actions";
import { SPEAKING_EXAMS, type SpeakingExam } from "@/lib/speaking/exams";
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
        description="Each topic belongs to one exam part and gives students a prompt to record an answer against."
        action={
          <Link
            href="/admin/speaking/review"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Review submissions
          </Link>
        }
      />

      <TopicForm />

      <div className="space-y-8">
        {(Object.keys(SPEAKING_EXAMS) as SpeakingExam[]).map((examKey) => {
          const examDef = SPEAKING_EXAMS[examKey];
          return (
            <div key={examKey}>
              <h2 className="text-lg font-bold text-slate-900">{examDef.label}</h2>
              <div className="mt-3 space-y-5">
                {examDef.parts.map((part) => (
                  <div key={part.key}>
                    <h3 className="text-sm font-semibold text-slate-600">
                      {part.label}{" "}
                      <span className="font-normal text-slate-400">— {part.description}</span>
                    </h3>
                    <div className="mt-2">
                      <TopicsTable
                        rows={topics.filter((t) => t.exam === examKey && t.part === part.key)}
                        onDelete={deleteTopic}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
