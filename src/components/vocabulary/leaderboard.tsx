import { getLeaderboard } from "@/lib/vocabulary/queries";
import type { VocabGameMode } from "@/lib/vocabulary/types";

export async function Leaderboard({
  categoryId,
  mode,
  title,
}: {
  categoryId: string;
  mode: VocabGameMode;
  title: string;
}) {
  const rows = await getLeaderboard(categoryId, mode);

  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      {rows.length === 0 ? (
        <p className="mt-2 text-sm text-slate-400">No scores yet — be the first!</p>
      ) : (
        <ol className="mt-2 space-y-1">
          {rows.map((r, i) => (
            <li
              key={i}
              className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
            >
              <span className="flex items-center gap-2">
                <span className="w-5 text-right font-semibold text-slate-400">{i + 1}.</span>
                {r.display_name ?? r.email}
              </span>
              <span className="font-semibold text-slate-900">
                {r.score}/{r.total}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
