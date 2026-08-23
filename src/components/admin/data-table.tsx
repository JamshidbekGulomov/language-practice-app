"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";

export type DataTableColumn<T> = {
  key: keyof T & string;
  label: string;
  render?: (row: T) => React.ReactNode;
};

/**
 * Generic list view for admin content: pass column definitions and rows,
 * optionally an onDelete handler (a Server Action bound to the row's id).
 * Each module builds its own create/edit forms around its own fields and
 * renders this for the list.
 */
export function DataTable<T extends { id: string | number }>({
  columns,
  rows,
  onDelete,
  emptyMessage = "Nothing here yet.",
}: {
  columns: DataTableColumn<T>[];
  rows: T[];
  onDelete?: (id: T["id"]) => Promise<void>;
  emptyMessage?: string;
}) {
  const [pendingId, setPendingId] = useState<T["id"] | null>(null);
  const [isPending, startTransition] = useTransition();

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3">
                {col.label}
              </th>
            ))}
            {onDelete && <th className="px-4 py-3" />}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={row.id}>
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-slate-700">
                  {col.render ? col.render(row) : String(row[col.key] ?? "")}
                </td>
              ))}
              {onDelete && (
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => {
                      setPendingId(row.id);
                      startTransition(async () => {
                        await onDelete(row.id);
                        setPendingId(null);
                      });
                    }}
                    disabled={isPending && pendingId === row.id}
                    className="text-slate-400 hover:text-red-600 disabled:opacity-50"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
