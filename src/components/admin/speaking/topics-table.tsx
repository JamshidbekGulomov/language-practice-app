"use client";

import Link from "next/link";
import { DataTable } from "@/components/admin/data-table";
import type { SpeakingTopic } from "@/lib/speaking/types";

export function TopicsTable({
  rows,
  onDelete,
}: {
  rows: SpeakingTopic[];
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
              href={`/admin/speaking/${row.id}`}
              className="font-medium text-slate-900 hover:underline"
            >
              {row.title}
            </Link>
          ),
        },
      ]}
      rows={rows}
      onDelete={onDelete}
      emptyMessage="No topics yet — create one above."
    />
  );
}
