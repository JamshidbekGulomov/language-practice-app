"use client";

import { DataTable } from "@/components/admin/data-table";
import type { ReadingWord } from "@/lib/reading/types";

export function ReadingWordsTable({
  rows,
  onDelete,
}: {
  rows: ReadingWord[];
  onDelete: (id: string) => Promise<void>;
}) {
  return (
    <DataTable
      columns={[
        { key: "word", label: "Word" },
        { key: "meaning", label: "Meaning", render: (w) => w.meaning ?? "—" },
      ]}
      rows={rows}
      onDelete={onDelete}
      emptyMessage="No words yet — add one above or bulk upload a file."
    />
  );
}
