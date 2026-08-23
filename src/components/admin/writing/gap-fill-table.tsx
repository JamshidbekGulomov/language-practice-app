"use client";

import { DataTable } from "@/components/admin/data-table";
import type { GapFillExercise } from "@/lib/writing/types";

export function GapFillTable({
  rows,
  onDelete,
}: {
  rows: GapFillExercise[];
  onDelete: (id: string) => Promise<void>;
}) {
  return (
    <DataTable
      columns={[
        { key: "prompt", label: "Prompt" },
        { key: "answer", label: "Answer" },
      ]}
      rows={rows}
      onDelete={onDelete}
      emptyMessage="No gap-fill sentences yet — add one above."
    />
  );
}
