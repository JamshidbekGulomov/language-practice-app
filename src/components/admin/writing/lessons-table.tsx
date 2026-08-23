"use client";

import Link from "next/link";
import { DataTable } from "@/components/admin/data-table";
import type { WritingLesson } from "@/lib/writing/types";

export function LessonsTable({
  rows,
  onDelete,
}: {
  rows: WritingLesson[];
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
              href={`/admin/writing/${row.id}`}
              className="font-medium text-slate-900 hover:underline"
            >
              {row.title}
            </Link>
          ),
        },
      ]}
      rows={rows}
      onDelete={onDelete}
      emptyMessage="No lessons yet — create one above."
    />
  );
}
