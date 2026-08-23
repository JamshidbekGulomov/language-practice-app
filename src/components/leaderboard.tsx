import type { LeaderboardRow } from "@/lib/leaderboard";

export function Leaderboard({ rows, title }: { rows: LeaderboardRow[]; title: string }) {
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
