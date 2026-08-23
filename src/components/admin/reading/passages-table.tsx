"use client";

import Link from "next/link";
import { DataTable } from "@/components/admin/data-table";
import type { ReadingPassage } from "@/lib/reading/types";
import { EXAM_LABELS } from "@/lib/exam";

type Row = ReadingPassage & { wordCount: number };

export function PassagesTable({
  rows,
  onDelete,
}: {
  rows: Row[];
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
              href={`/admin/reading/${row.id}`}
              className="font-medium text-slate-900 hover:underline"
            >
              {row.title}
            </Link>
          ),
        },
        { key: "wordCount", label: "Words" },
        {
          key: "exam",
          label: "Exam",
          render: (row) => (row.exam ? EXAM_LABELS[row.exam] : "General"),
        },
      ]}
      rows={rows}
      onDelete={onDelete}
      emptyMessage="No passages yet — create one above."
    />
  );
}
