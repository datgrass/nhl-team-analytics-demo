import type { StandingsTeam } from "../types";

interface Props {
  record: { wins: number; losses: number; otl: number; points: number };
  standings: StandingsTeam[];
}

export default function TeamHeader({ record, standings }: Props) {
  const col = standings.find((t) => t.teamAbbrev?.default === "COL");
  const divRank = col?.divisionSequence ?? "-";
  const confRank = col?.conferenceSequence ?? "-";
  const streak = col ? `${col.streakCode}${col.streakCount}` : "-";
  const l10 = col ? `${col.l10Wins}-${col.l10Losses}-${col.l10OtLosses}` : "-";

  return (
    <div className="bg-gradient-to-r from-avs-burgundy via-avs-dark to-avs-blue">
      <div className="max-w-[1600px] mx-auto px-4 py-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Team Identity */}
          <div className="flex items-center gap-5">
            {col?.teamLogo && (
              <img src={col.teamLogo} alt="COL" className="w-20 h-20 drop-shadow-lg" />
            )}
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">
                Colorado Avalanche
              </h1>
              <p className="text-avs-silver text-sm mt-1">
                2025-26 Season &middot; Central Division
              </p>
            </div>
          </div>

          {/* Record Stats */}
          <div className="flex gap-6 text-center">
            <StatBox label="Record" value={`${record.wins}-${record.losses}-${record.otl}`} />
            <StatBox label="Points" value={String(record.points)} highlight />
            <StatBox label="Division" value={`${divRank}${ordinal(Number(divRank))}`} />
            <StatBox label="Conference" value={`${confRank}${ordinal(Number(confRank))}`} />
            <StatBox label="Streak" value={streak} />
            <StatBox label="Last 10" value={l10} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="min-w-[70px]">
      <div className={`text-2xl font-bold ${highlight ? "text-yellow-400" : "text-white"}`}>
        {value}
      </div>
      <div className="text-xs text-avs-silver uppercase tracking-wider">{label}</div>
    </div>
  );
}

function ordinal(n: number): string {
  if (isNaN(n)) return "";
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
