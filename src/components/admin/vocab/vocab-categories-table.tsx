"use client";

import Link from "next/link";
import { DataTable } from "@/components/admin/data-table";
import type { VocabCategory } from "@/lib/vocabulary/types";

type Row = VocabCategory & { wordCount: number };

export function VocabCategoriesTable({
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
          key: "name",
          label: "Name",
          render: (row) => (
            <Link
              href={`/admin/vocabulary/${row.id}`}
              className="font-medium text-slate-900 hover:underline"
            >
              {row.name}
            </Link>
          ),
        },
        { key: "wordCount", label: "Words" },
      ]}
      rows={rows}
      onDelete={onDelete}
      emptyMessage="No categories yet — create one above."
    />
  );
}
