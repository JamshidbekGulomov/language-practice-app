"use client";

import { DataTable } from "@/components/admin/data-table";
import type { SpeakingQuestion } from "@/lib/speaking/types";

export function QuestionsTable({
  rows,
  onDelete,
}: {
  rows: SpeakingQuestion[];
  onDelete: (id: string) => Promise<void>;
}) {
  return (
    <DataTable
      columns={[{ key: "question", label: "Question" }]}
      rows={rows}
      onDelete={onDelete}
      emptyMessage="No guided questions yet — add one above."
    />
  );
}
