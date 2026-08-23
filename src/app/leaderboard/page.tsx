import { Trophy, Crown, Gem } from "lucide-react";
import { getGlobalLeaderboard, type GlobalLeaderboardRow } from "@/lib/leaderboard";

function displayName(row: GlobalLeaderboardRow): string {
  return row.display_name || row.email || "Anonymous";
}

function initial(row: GlobalLeaderboardRow): string {
  return displayName(row).charAt(0).toUpperCase();
}

const PODIUM_STYLE = {
  1: {
    border: "border-amber-400",
    bg: "bg-gradient-to-b from-amber-50 to-white",
    avatar: "bg-gradient-to-br from-amber-400 to-orange-500",
    lift: "sm:-mt-6",
  },
  2: {
    border: "border-slate-300",
    bg: "bg-gradient-to-b from-slate-50 to-white",
    avatar: "bg-gradient-to-br from-slate-400 to-slate-500",
    lift: "",
  },
  3: {
    border: "border-orange-300",
    bg: "bg-gradient-to-b from-orange-50 to-white",
    avatar: "bg-gradient-to-br from-orange-400 to-orange-500",
    lift: "",
  },
} as const;

function PodiumCard({ row, rank }: { row: GlobalLeaderboardRow; rank: 1 | 2 | 3 }) {
  const style = PODIUM_STYLE[rank];
  return (
    <div
      className={`relative flex-1 rounded-2xl border-2 ${style.border} ${style.bg} ${style.lift} px-4 pb-5 pt-8 text-center shadow-sm`}
    >
      {rank === 1 && (
        <Crown className="absolute -top-4 left-1/2 h-7 w-7 -translate-x-1/2 text-amber-500" />
      )}
      <span
        className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full text-xl font-bold text-white shadow-sm ${style.avatar}`}
      >
        {initial(row)}
      </span>
      <p className="mt-3 truncate text-sm font-bold text-slate-900">{displayName(row)}</p>
      <p className="mt-1 flex items-center justify-center gap-1 text-sm font-semibold text-sky-600">
        <Gem className="h-4 w-4" />
        {row.diamonds}
      </p>
    </div>
  );
}

export default async function LeaderboardPage() {
  const rows = await getGlobalLeaderboard(20);
  const top3 = rows.slice(0, 3);
  const rest = rows.slice(3);
  const podiumOrder: Array<{ row: GlobalLeaderboardRow; rank: 1 | 2 | 3 } | null> = [
    top3[1] ? { row: top3[1], rank: 2 } : null,
    top3[0] ? { row: top3[0], rank: 1 } : null,
    top3[2] ? { row: top3[2], rank: 3 } : null,
  ];

  return (
    <div>
      <div className="bg-gradient-to-r from-red-600 to-rose-500 px-4 py-12 text-center text-white sm:px-6">
        <h1 className="flex items-center justify-center gap-2 text-3xl font-extrabold tracking-tight">
          <Trophy className="h-8 w-8" />
          Leaderboard
        </h1>
        <p className="mt-2 text-rose-50">
          One diamond per correct answer. Keep your streak going!
        </p>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        {rows.length === 0 ? (
          <p className="text-center text-sm text-slate-400">
            No scores yet — play a game to be the first on the board!
          </p>
        ) : (
          <>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              {podiumOrder.map((entry) =>
                entry ? <PodiumCard key={entry.row.user_id} row={entry.row} rank={entry.rank} /> : null,
              )}
            </div>

            {rest.length > 0 && (
              <div className="mt-10 overflow-hidden rounded-xl border border-slate-200">
                {rest.map((row, i) => (
                  <div
                    key={row.user_id}
                    className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 text-right text-sm font-semibold text-slate-400">
                        {i + 4}
                      </span>
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-sm font-bold text-white">
                        {initial(row)}
                      </span>
                      <span className="font-medium text-slate-900">{displayName(row)}</span>
                    </div>
                    <span className="flex items-center gap-1 font-semibold text-sky-600">
                      <Gem className="h-4 w-4" />
                      {row.diamonds}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
