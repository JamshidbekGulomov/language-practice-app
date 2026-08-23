"use client";

import Link from "next/link";
import { DataTable } from "@/components/admin/data-table";
import type { TranslationLevel } from "@/lib/translation/types";

export function LevelsTable({
  rows,
  onDelete,
}: {
  rows: TranslationLevel[];
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
              href={`/admin/translation/${row.id}`}
              className="font-medium text-slate-900 hover:underline"
            >
              {row.title}
            </Link>
          ),
        },
      ]}
      rows={rows}
      onDelete={onDelete}
      emptyMessage="No levels yet — create one above."
    />
  );
}
