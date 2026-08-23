"use client";

import Link from "next/link";
import { DataTable } from "@/components/admin/data-table";
import { EXAM_LABELS } from "@/lib/exam";
import type { ReadingExamTest } from "@/lib/reading-exam/types";

export function TestsTable({
  rows,
  onDelete,
}: {
  rows: ReadingExamTest[];
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
              href={`/admin/reading-exam/${row.id}`}
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
      emptyMessage="No reading exam tests yet — create one above."
    />
  );
}
