"use client";

import { DataTable } from "@/components/admin/data-table";
import type { SentencePrompt } from "@/lib/writing/types";

export function SentencePromptsTable({
  rows,
  onDelete,
}: {
  rows: SentencePrompt[];
  onDelete: (id: string) => Promise<void>;
}) {
  return (
    <DataTable
      columns={[
        { key: "words", label: "Words to use" },
        { key: "model_answer", label: "Model answer", render: (r) => r.model_answer ?? "—" },
      ]}
      rows={rows}
      onDelete={onDelete}
      emptyMessage="No sentence prompts yet — add one above."
    />
  );
}
