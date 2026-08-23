"use client";

import { DataTable } from "@/components/admin/data-table";
import type { TranslationSentence } from "@/lib/translation/types";

export function SentencesTable({
  rows,
  onDelete,
}: {
  rows: TranslationSentence[];
  onDelete: (id: string) => Promise<void>;
}) {
  return (
    <DataTable
      columns={[
        { key: "uzbek_text", label: "Uzbek sentence" },
        { key: "model_answer", label: "Model answer", render: (r) => r.model_answer ?? "—" },
      ]}
      rows={rows}
      onDelete={onDelete}
      emptyMessage="No sentences yet — add one above."
    />
  );
}
