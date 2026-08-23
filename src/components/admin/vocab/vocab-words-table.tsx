"use client";

import { DataTable } from "@/components/admin/data-table";
import type { VocabWord } from "@/lib/vocabulary/types";

export function VocabWordsTable({
  rows,
  onDelete,
}: {
  rows: VocabWord[];
  onDelete: (id: string) => Promise<void>;
}) {
  return (
    <DataTable
      columns={[
        { key: "english", label: "English" },
        { key: "uzbek", label: "Uzbek" },
        { key: "synonym", label: "Synonym", render: (w) => w.synonym ?? "—" },
        { key: "difficulty", label: "Difficulty", render: (w) => w.difficulty ?? "—" },
      ]}
      rows={rows}
      onDelete={onDelete}
      emptyMessage="No words yet — add one above or bulk upload a file."
    />
  );
}
