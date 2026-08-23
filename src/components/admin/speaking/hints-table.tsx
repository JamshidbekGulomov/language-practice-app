"use client";

import { DataTable } from "@/components/admin/data-table";
import type { SpeakingHint } from "@/lib/speaking/types";

export function HintsTable({
  rows,
  onDelete,
}: {
  rows: SpeakingHint[];
  onDelete: (id: string) => Promise<void>;
}) {
  return (
    <DataTable
      columns={[
        { key: "word", label: "Word" },
        { key: "meaning", label: "Meaning", render: (r) => r.meaning ?? "—" },
      ]}
      rows={rows}
      onDelete={onDelete}
      emptyMessage="No vocab hints yet — add one above."
    />
  );
}
