import Link from "next/link";
import { adminList } from "@/lib/admin/crud";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { LevelsTable } from "@/components/admin/translation/levels-table";
import { createLevel, deleteLevel } from "@/app/admin/translation/actions";
import type { TranslationLevel } from "@/lib/translation/types";

export default async function AdminTranslationPage() {
  const levels = await adminList<TranslationLevel>("translation_levels", {
    orderBy: "created_at",
    ascending: false,
  });

  return (
    <div>
      <AdminPageHeader
        title="Translation levels"
        description="Each level groups sentences students translate from Uzbek into English."
        action={
          <Link
            href="/admin/translation/review"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Review submissions
          </Link>
        }
      />

      <form action={createLevel} className="mb-6 space-y-3 rounded-lg border border-slate-200 p-4">
        <input
          name="title"
          placeholder="Level title (e.g. Beginner, A2, Intermediate)"
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <textarea
          name="description"
          placeholder="Description (optional)"
          rows={3}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-lg bg-gradient-to-r from-indigo-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white transition hover:from-indigo-500 hover:to-fuchsia-500"
        >
          Create level
        </button>
      </form>

      <LevelsTable rows={levels} onDelete={deleteLevel} />
    </div>
  );
}
