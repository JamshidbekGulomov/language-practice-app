"use client";

import Link from "next/link";
import { DataTable } from "@/components/admin/data-table";
import { EXAM_LABELS } from "@/lib/exam";
import type { ListeningExamTest } from "@/lib/listening-exam/types";

export function ListeningTestsTable({
  rows,
  onDelete,
}: {
  rows: ListeningExamTest[];
  onDelete: (id: string) => Promise<void>;
}) {
  return (
    <DataTable
      columns={[
        {
          key: "title",
          label: "Title",
          render: (row) => (
            <Link
              href={`/admin/listening-exam/${row.id}`}
              className="font-medium text-slate-900 hover:underline"
            >
              {row.title}
            </Link>
          ),
        },
        { key: "exam", label: "Exam", render: (row) => EXAM_LABELS[row.exam] },
      ]}
      rows={rows}
      onDelete={onDelete}
      emptyMessage="No listening exam tests yet — create one above."
    />
  );
}
