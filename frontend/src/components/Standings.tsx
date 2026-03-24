import type { StandingsTeam } from "../types";

interface Props {
  teams: StandingsTeam[];
}

export default function Standings({ teams }: Props) {
  return (
    <div className="bg-avs-dark rounded-xl p-6 card-glow">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <span className="w-1 h-6 bg-avs-blue rounded-full" />
        Central Division
      </h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-avs-silver text-xs uppercase border-b border-white/10">
            <th className="text-left py-2">#</th>
            <th className="text-left py-2">Team</th>
            <th className="text-center py-2">GP</th>
            <th className="text-center py-2">W</th>
            <th className="text-center py-2">L</th>
            <th className="text-center py-2">OTL</th>
            <th className="text-center py-2 text-yellow-400 font-bold">PTS</th>
            <th className="text-center py-2">P%</th>
            <th className="text-center py-2">GF</th>
            <th className="text-center py-2">GA</th>
            <th className="text-center py-2">DIFF</th>
            <th className="text-center py-2">STRK</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((t, i) => {
            const isCOL = t.teamAbbrev?.default === "COL";
            return (
              <tr
                key={t.teamAbbrev?.default}
                className={`border-b border-white/5 hover:bg-white/5 transition-colors ${
                  isCOL ? "bg-avs-burgundy/15 font-semibold" : ""
                }`}
              >
                <td className="py-2 text-avs-silver">{i + 1}</td>
                <td className="py-2">
                  <div className="flex items-center gap-2">
                    <img src={t.teamLogo} alt="" className="w-6 h-6" />
                    <span>{t.teamAbbrev?.default}</span>
                  </div>
                </td>
                <td className="text-center">{t.gamesPlayed}</td>
                <td className="text-center">{t.wins}</td>
                <td className="text-center">{t.losses}</td>
                <td className="text-center">{t.otLosses}</td>
                <td className="text-center text-yellow-400 font-bold">{t.points}</td>
                <td className="text-center text-avs-silver">
                  {(t.pointPctg * 100).toFixed(1)}%
                </td>
                <td className="text-center">{t.goalFor}</td>
                <td className="text-center">{t.goalAgainst}</td>
                <td
                  className={`text-center ${
                    t.goalDifferential > 0
                      ? "text-green-400"
                      : t.goalDifferential < 0
                      ? "text-red-400"
                      : ""
                  }`}
                >
                  {t.goalDifferential > 0 ? "+" : ""}
                  {t.goalDifferential}
                </td>
                <td className="text-center text-avs-silver">
                  {t.streakCode}
                  {t.streakCount}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
