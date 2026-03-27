import { useEffect, useState } from "react";
import type { Game, GameSummary, BoxScore, BoxScorePlayer } from "../types";
import VideoReviewPage from "./VideoReviewPage";

const SKATER_COLS: { key: keyof BoxScorePlayer; label: string; width: string }[] = [
  { key: "name", label: "Player", width: "w-40" },
  { key: "position", label: "Pos", width: "w-10" },
  { key: "goals", label: "G", width: "w-8" },
  { key: "assists", label: "A", width: "w-8" },
  { key: "points", label: "PTS", width: "w-10" },
  { key: "plusMinus", label: "+/-", width: "w-10" },
  { key: "shots", label: "SOG", width: "w-10" },
  { key: "hits", label: "HIT", width: "w-10" },
  { key: "blockedShots", label: "BLK", width: "w-10" },
  { key: "pim", label: "PIM", width: "w-10" },
  { key: "toi", label: "TOI", width: "w-14" },
];

const GOALIE_COLS: { key: string; label: string; width: string }[] = [
  { key: "name", label: "Goalie", width: "w-40" },
  { key: "saves", label: "SV", width: "w-10" },
  { key: "shotsAgainst", label: "SA", width: "w-10" },
  { key: "goalsAgainst", label: "GA", width: "w-10" },
  { key: "savePctg", label: "SV%", width: "w-14" },
  { key: "toi", label: "TOI", width: "w-14" },
];

function SkaterTable({ players, teamAbbrev }: { players: BoxScorePlayer[]; teamAbbrev: string }) {
  const sorted = [...players].sort((a, b) => b.points - a.points || b.goals - a.goals || (b.toi > a.toi ? 1 : -1));
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10">
            {SKATER_COLS.map((col) => (
              <th
                key={col.key}
                className={`py-2 px-1.5 text-[10px] text-avs-silver uppercase tracking-wider font-semibold ${
                  col.key === "name" ? "text-left" : "text-center"
                } ${col.width}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((p) => {
            const hasPoints = p.goals > 0 || p.assists > 0;
            return (
              <tr
                key={p.playerId || p.name}
                className={`border-b border-white/5 transition-colors hover:bg-white/5 ${
                  hasPoints ? "bg-green-500/5" : ""
                }`}
              >
                {SKATER_COLS.map((col) => {
                  let val: any = p[col.key as keyof BoxScorePlayer];
                  if (col.key === "name") {
                    return (
                      <td key={col.key} className="py-1.5 px-1.5 text-left font-medium whitespace-nowrap">
                        <span className="text-avs-silver text-xs mr-1.5">#{p.sweaterNumber}</span>
                        {p.name}
                      </td>
                    );
                  }
                  if (col.key === "plusMinus") {
                    const v = val as number;
                    return (
                      <td
                        key={col.key}
                        className={`py-1.5 px-1.5 text-center font-mono text-xs ${
                          v > 0 ? "text-green-400" : v < 0 ? "text-red-400" : "text-avs-silver"
                        }`}
                      >
                        {v > 0 ? `+${v}` : v}
                      </td>
                    );
                  }
                  if (col.key === "toi") {
                    return (
                      <td key={col.key} className="py-1.5 px-1.5 text-center font-mono text-xs">
                        {val}
                      </td>
                    );
                  }
                  return (
                    <td
                      key={col.key}
                      className={`py-1.5 px-1.5 text-center text-xs ${
                        (col.key === "goals" || col.key === "points") && (val as number) > 0
                          ? "font-bold text-white"
                          : "text-avs-silver"
                      }`}
                    >
                      {val}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function GoalieTable({ players }: { players: BoxScorePlayer[] }) {
  return (
    <div className="overflow-x-auto mt-3">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10">
            {GOALIE_COLS.map((col) => (
              <th
                key={col.key}
                className={`py-2 px-1.5 text-[10px] text-avs-silver uppercase tracking-wider font-semibold ${
                  col.key === "name" ? "text-left" : "text-center"
                } ${col.width}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {players.filter((p) => p.toi !== "0:00" && p.toi !== "00:00").map((p) => (
            <tr key={p.playerId || p.name} className="border-b border-white/5 hover:bg-white/5">
              <td className="py-1.5 px-1.5 text-left font-medium whitespace-nowrap">
                <span className="text-avs-silver text-xs mr-1.5">#{p.sweaterNumber}</span>
                {p.name}
              </td>
              <td className="py-1.5 px-1.5 text-center text-xs font-bold">{p.saves}</td>
              <td className="py-1.5 px-1.5 text-center text-xs text-avs-silver">{p.shotsAgainst}</td>
              <td className="py-1.5 px-1.5 text-center text-xs text-avs-silver">{p.goalsAgainst}</td>
              <td className="py-1.5 px-1.5 text-center text-xs font-mono">
                {p.savePctg != null ? (p.savePctg >= 1 ? p.savePctg.toFixed(3) : `.${(p.savePctg * 1000).toFixed(0).padStart(3, "0")}`) : "-"}
              </td>
              <td className="py-1.5 px-1.5 text-center text-xs font-mono">{p.toi}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface GameSummaryProps {
  initialGameId?: number | null;
  onGameChange?: (gameId: number) => void;
}

type ViewMode = "summary" | "video";

export default function GameSummaryPage({ initialGameId, onGameChange }: GameSummaryProps) {
  const [view, setView] = useState<ViewMode>("summary");
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<number | null>(initialGameId ?? null);
  const [summary, setSummary] = useState<GameSummary | null>(null);
  const [boxScore, setBoxScore] = useState<BoxScore | null>(null);
  const [teams, setTeams] = useState<{ home: any; away: any } | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedTeamIdx, setSelectedTeamIdx] = useState(0);
  const [penaltyCounts, setPenaltyCounts] = useState<{ away: number; home: number }>({ away: 0, home: 0 });

  useEffect(() => {
    fetch("/api/games")
      .then((r) => r.json())
      .then((data) => {
        setGames(data);
        if (initialGameId && data.some((g: Game) => g.id === initialGameId)) {
          setSelectedGameId(initialGameId);
        } else if (data.length > 0) {
          setSelectedGameId(data[0].id);
        }
      });
  }, []);

  useEffect(() => {
    if (!selectedGameId) return;
    setLoading(true);
    setSummary(null);
    setBoxScore(null);
    setSelectedTeamIdx(0);

    Promise.all([
      fetch(`/api/game/${selectedGameId}/summary`).then((r) => r.json()),
      fetch(`/api/game/${selectedGameId}/boxscore`).then((r) => r.json()),
      fetch(`/api/game/${selectedGameId}/play-by-play`).then((r) => r.json()),
    ])
      .then(([summaryData, boxData, pbpData]) => {
        setSummary(summaryData);
        setBoxScore(boxData);
        const homeId = pbpData.homeTeam?.id;
        const awayId = pbpData.awayTeam?.id;
        const penalties = (pbpData.plays || []).filter((p: any) => p.typeDescKey === "penalty");
        setPenaltyCounts({
          away: penalties.filter((p: any) => p.details?.eventOwnerTeamId === awayId).length,
          home: penalties.filter((p: any) => p.details?.eventOwnerTeamId === homeId).length,
        });
        setTeams({ home: pbpData.homeTeam, away: pbpData.awayTeam });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedGameId]);

  const selectedGame = games.find((g) => g.id === selectedGameId);

  return (
    <div className="space-y-6">
      {/* Header & Game Selector */}
      <div className="bg-avs-dark rounded-xl p-6 card-glow">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="w-1 h-6 bg-avs-burgundy rounded-full" />
            Game Center
          </h2>
          <select
            value={selectedGameId || ""}
            onChange={(e) => { const id = Number(e.target.value); setSelectedGameId(id); onGameChange?.(id); }}
            className="bg-avs-darker text-white text-sm font-medium rounded-lg px-4 py-2 border border-white/10 focus:border-avs-burgundy focus:outline-none cursor-pointer min-w-[300px]"
          >
            {games.map((g) => {
              const date = new Date(g.startTimeUTC).toLocaleDateString("en-US", { month: "short", day: "numeric" });
              const isHome = g.homeTeam.abbrev === "COL";
              const opp = isHome ? g.awayTeam.abbrev : g.homeTeam.abbrev;
              const prefix = isHome ? "vs" : "@";
              const score = `${g.awayTeam.score}-${g.homeTeam.score}`;
              return (
                <option key={g.id} value={g.id}>
                  {date} {prefix} {opp} ({score})
                </option>
              );
            })}
          </select>
          <div className="flex rounded-lg bg-avs-darker p-1 border border-white/10">
            <button
              onClick={() => setView("summary")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${
                view === "summary"
                  ? "bg-avs-burgundy text-white shadow-lg shadow-avs-burgundy/20"
                  : "text-avs-silver hover:text-white"
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              Game Summary
            </button>
            <button
              onClick={() => setView("video")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${
                view === "video"
                  ? "bg-avs-burgundy text-white shadow-lg shadow-avs-burgundy/20"
                  : "text-avs-silver hover:text-white"
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Video Review
            </button>
          </div>
        </div>

        {/* Game Score Banner */}
        {selectedGame && teams && (
          <div className="mt-4 flex items-center justify-center gap-8 bg-avs-darker rounded-lg p-4">
            <div className="flex items-center gap-3">
              {teams.away?.logo && <img src={teams.away.logo} alt="" className="w-10 h-10" />}
              <span className="text-lg font-bold">{teams.away?.abbrev}</span>
              <span className="text-3xl font-extrabold">{selectedGame.awayTeam.score}</span>
            </div>
            <div className="text-avs-silver text-sm">
              FINAL{selectedGame.gameOutcome?.lastPeriodType !== "REG" ? ` (${selectedGame.gameOutcome?.lastPeriodType})` : ""}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-extrabold">{selectedGame.homeTeam.score}</span>
              <span className="text-lg font-bold">{teams.home?.abbrev}</span>
              {teams.home?.logo && <img src={teams.home.logo} alt="" className="w-10 h-10" />}
            </div>
          </div>
        )}

      </div>

      {view === "video" ? (
        <VideoReviewPage embedded externalGameId={selectedGameId} />
      ) : loading ? (
        <div className="flex justify-center py-12">
          <div className="w-12 h-12 border-4 border-avs-burgundy border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Box Score - 2/3 width */}
          <div className="lg:col-span-2">
            {boxScore && boxScore.teams.length > 0 && (() => {
              const team = boxScore.teams[selectedTeamIdx] || boxScore.teams[0];
              return (
                <div className="bg-avs-dark rounded-xl p-5 card-glow">
                  {/* Team toggle buttons */}
                  <div className="flex items-center gap-2 mb-4">
                    {boxScore.teams.map((t, idx) => (
                      <button
                        key={t.abbrev}
                        onClick={() => setSelectedTeamIdx(idx)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                          selectedTeamIdx === idx
                            ? "bg-avs-burgundy text-white shadow-lg shadow-avs-burgundy/20"
                            : "bg-avs-darker text-avs-silver hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        {teams && (
                          <img
                            src={t.abbrev === teams.home?.abbrev ? teams.home?.logo : teams.away?.logo}
                            alt=""
                            className="w-6 h-6"
                          />
                        )}
                        {t.abbrev}
                      </button>
                    ))}
                    <div className="flex-1" />
                    <span className="text-xs text-avs-silver">
                      {team.skaters.length} skaters &middot; {team.goalies.filter((p) => p.toi !== "0:00" && p.toi !== "00:00").length} goalies
                    </span>
                  </div>
                  <SkaterTable players={team.skaters} teamAbbrev={team.abbrev} />
                  {team.goalies.length > 0 && <GoalieTable players={team.goalies} />}
                </div>
              );
            })()}
          </div>

          {/* Three Stars - right column */}
          <div className="space-y-4">
            {summary && summary.threeStars.length > 0 && (
              <div className="bg-avs-dark rounded-xl p-5 card-glow">
                <h3 className="text-sm text-avs-silver uppercase tracking-wider mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Three Stars
                </h3>
                <div className="space-y-3">
                  {summary.threeStars.map((star) => {
                    const starLabel = star.star === 1 ? "1st" : star.star === 2 ? "2nd" : "3rd";
                    const isCol = star.teamAbbrev === "COL";
                    const isGoalie = star.position === "G";
                    // Look up goalie stats from box score
                    const goalieStats = isGoalie && boxScore
                      ? boxScore.teams
                          .flatMap((t) => t.goalies)
                          .find((g) => String(g.playerId) === String(star.playerId))
                      : null;
                    return (
                      <div
                        key={star.star}
                        className={`flex items-center gap-4 p-4 rounded-lg ${
                          star.star === 1
                            ? "bg-gradient-to-r from-yellow-500/10 to-transparent border border-yellow-500/20"
                            : "bg-avs-darker"
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-extrabold text-sm ${
                          star.star === 1
                            ? "bg-yellow-500/20 text-yellow-400"
                            : star.star === 2
                            ? "bg-gray-400/20 text-gray-300"
                            : "bg-amber-700/20 text-amber-600"
                        }`}>
                          {starLabel}
                        </div>
                        {star.headshot ? (
                          <img src={star.headshot} alt="" className="w-12 h-12 rounded-full bg-white/10 shrink-0" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-sm text-avs-silver shrink-0">
                            {star.firstName?.[0]}{star.lastName?.[0]}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm">
                            {star.firstName} {star.lastName}
                          </div>
                          <div className="text-xs text-avs-silver flex items-center gap-2 mt-0.5">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              isCol ? "bg-avs-burgundy/30 text-white" : "bg-white/10"
                            }`}>
                              {star.teamAbbrev}
                            </span>
                            <span>{star.position}</span>
                          </div>
                        </div>
                        {isGoalie && goalieStats ? (
                          <div className="text-right shrink-0">
                            <div className="text-lg font-extrabold">
                              {goalieStats.savePctg != null
                                ? goalieStats.savePctg >= 1
                                  ? goalieStats.savePctg.toFixed(3)
                                  : `.${(goalieStats.savePctg * 1000).toFixed(0).padStart(3, "0")}`
                                : "-"}
                            </div>
                            <div className="text-xs text-avs-silver">
                              {goalieStats.saves}SV / {goalieStats.shotsAgainst}SA
                            </div>
                          </div>
                        ) : (
                          <div className="text-right shrink-0">
                            <div className="text-lg font-extrabold">{star.points}P</div>
                            <div className="text-xs text-avs-silver">{star.goals}G {star.assists}A</div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Matchup Card */}
            {boxScore && boxScore.teams.length === 2 && teams && (() => {
              const away = boxScore.teams[0];
              const home = boxScore.teams[1];
              const sumStat = (t: typeof away, key: keyof BoxScorePlayer) =>
                t.skaters.reduce((acc, p) => acc + ((p[key] as number) || 0), 0);

              const awayGoals = sumStat(away, "goals");
              const homeGoals = sumStat(home, "goals");
              const awayShots = sumStat(away, "shots");
              const homeShots = sumStat(home, "shots");
              const awayHits = sumStat(away, "hits");
              const homeHits = sumStat(home, "hits");
              const awayPim = sumStat(away, "pim") + away.goalies.reduce((acc, g) => acc + (g.pim || 0), 0);
              const homePim = sumStat(home, "pim") + home.goalies.reduce((acc, g) => acc + (g.pim || 0), 0);

              const goalieAvg = (t: typeof away) => {
                const active = t.goalies.filter((g) => g.toi !== "0:00" && g.toi !== "00:00" && g.savePctg != null);
                if (active.length === 0) return 0;
                return active.reduce((acc, g) => acc + (g.savePctg || 0), 0) / active.length;
              };
              const awaySvPct = goalieAvg(away);
              const homeSvPct = goalieAvg(home);

              const stats: { label: string; away: string; home: string; awayVal: number; homeVal: number; lower?: boolean }[] = [
                { label: "Goals", away: String(awayGoals), home: String(homeGoals), awayVal: awayGoals, homeVal: homeGoals },
                { label: "Shots", away: String(awayShots), home: String(homeShots), awayVal: awayShots, homeVal: homeShots },
                { label: "Hits", away: String(awayHits), home: String(homeHits), awayVal: awayHits, homeVal: homeHits },
                { label: "Penalties", away: String(penaltyCounts.away), home: String(penaltyCounts.home), awayVal: penaltyCounts.away, homeVal: penaltyCounts.home, lower: true },
                { label: "PIM", away: String(awayPim), home: String(homePim), awayVal: awayPim, homeVal: homePim, lower: true },
                {
                  label: "Save %",
                  away: awaySvPct >= 1 ? awaySvPct.toFixed(3) : `.${(awaySvPct * 1000).toFixed(0).padStart(3, "0")}`,
                  home: homeSvPct >= 1 ? homeSvPct.toFixed(3) : `.${(homeSvPct * 1000).toFixed(0).padStart(3, "0")}`,
                  awayVal: awaySvPct,
                  homeVal: homeSvPct,
                },
              ];

              return (
                <div className="bg-avs-dark rounded-xl p-5 card-glow">
                  <h3 className="text-sm text-avs-silver uppercase tracking-wider mb-4 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                    </svg>
                    Game Matchup
                  </h3>

                  {/* Team headers */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      {teams.away?.logo && <img src={teams.away.logo} alt="" className="w-8 h-8" />}
                      <span className="font-bold text-sm">{teams.away?.abbrev}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">{teams.home?.abbrev}</span>
                      {teams.home?.logo && <img src={teams.home.logo} alt="" className="w-8 h-8" />}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {stats.map((s) => {
                      const total = s.awayVal + s.homeVal || 1;
                      const awayBetter = s.lower ? s.awayVal < s.homeVal : s.awayVal > s.homeVal;
                      const homeBetter = s.lower ? s.homeVal < s.awayVal : s.homeVal > s.awayVal;
                      return (
                        <div key={s.label} className="space-y-0.5">
                          <div className="text-[10px] text-avs-silver/60 text-center uppercase tracking-wider">{s.label}</div>
                          <div className="flex items-center gap-2 text-sm">
                            <div className={`w-14 text-right font-mono ${awayBetter ? "text-green-400 font-semibold" : "text-avs-silver"}`}>
                              {s.away}
                            </div>
                            <div className="flex-1 h-1.5 bg-avs-darker rounded-full overflow-hidden flex">
                              <div
                                className={`h-full rounded-l-full ${awayBetter ? "bg-green-500" : "bg-avs-silver/30"}`}
                                style={{ width: `${(s.awayVal / total) * 100}%` }}
                              />
                              <div
                                className={`h-full rounded-r-full ${homeBetter ? "bg-green-500" : "bg-avs-silver/30"}`}
                                style={{ width: `${(s.homeVal / total) * 100}%` }}
                              />
                            </div>
                            <div className={`w-14 text-left font-mono ${homeBetter ? "text-green-400 font-semibold" : "text-avs-silver"}`}>
                              {s.home}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
