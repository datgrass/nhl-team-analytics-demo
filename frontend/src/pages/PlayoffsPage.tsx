import { useMemo, useState } from "react";
import type { StandingsTeam } from "../types";

interface Props {
  standings: StandingsTeam[];
}

interface Seed {
  seed: number;
  team: StandingsTeam;
  label: string;
}

interface Matchup {
  id: string;
  home: Seed;
  away: Seed;
}

function buildBracket(standings: StandingsTeam[]) {
  function getConferenceMatchups(confName: string, div1Abbrev: string, div2Abbrev: string): Matchup[] {
    const confTeams = standings.filter((t) => t.conferenceName === confName);
    const div1 = confTeams.filter((t) => t.divisionAbbrev === div1Abbrev).sort((a, b) => a.divisionSequence - b.divisionSequence);
    const div2 = confTeams.filter((t) => t.divisionAbbrev === div2Abbrev).sort((a, b) => a.divisionSequence - b.divisionSequence);

    const div1Top3 = div1.slice(0, 3);
    const div2Top3 = div2.slice(0, 3);
    const qualified = new Set([...div1Top3, ...div2Top3].map((t) => t.teamAbbrev?.default));
    const remaining = confTeams.filter((t) => !qualified.has(t.teamAbbrev?.default)).sort((a, b) => b.points - a.points);
    const wildcards = remaining.slice(0, 2);

    const d1Winner = div1Top3[0], d2Winner = div2Top3[0];
    const d1Better = d1Winner.points > d2Winner.points || (d1Winner.points === d2Winner.points && d1Winner.wins > d2Winner.wins);

    const bestWinner = d1Better ? d1Winner : d2Winner;
    const secondWinner = d1Better ? d2Winner : d1Winner;
    const bestDiv = d1Better ? div1Abbrev : div2Abbrev;
    const secondDiv = d1Better ? div2Abbrev : div1Abbrev;
    const bestDiv2 = d1Better ? div1Top3[1] : div2Top3[1];
    const bestDiv3 = d1Better ? div1Top3[2] : div2Top3[2];
    const secondDiv2 = d1Better ? div2Top3[1] : div1Top3[1];
    const secondDiv3 = d1Better ? div2Top3[2] : div1Top3[2];

    return [
      { id: `${confName}-A1`, home: { seed: 1, team: bestWinner, label: `${bestDiv}1` }, away: { seed: 8, team: wildcards[1], label: "WC2" } },
      { id: `${confName}-A2`, home: { seed: 4, team: bestDiv2, label: `${bestDiv}2` }, away: { seed: 5, team: bestDiv3, label: `${bestDiv}3` } },
      { id: `${confName}-B1`, home: { seed: 2, team: secondWinner, label: `${secondDiv}1` }, away: { seed: 7, team: wildcards[0], label: "WC1" } },
      { id: `${confName}-B2`, home: { seed: 3, team: secondDiv2, label: `${secondDiv}2` }, away: { seed: 6, team: secondDiv3, label: `${secondDiv}3` } },
    ];
  }

  return {
    west: getConferenceMatchups("Western", "C", "P"),
    east: getConferenceMatchups("Eastern", "A", "M"),
  };
}

const Trophy = ({ size = 28 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className="text-yellow-400">
    <path d="M5.166 2.621v.858c-1.035.148-2.059.33-3.071.543a.75.75 0 00-.584.859 6.753 6.753 0 006.138 5.6 6.73 6.73 0 002.743 1.346A6.707 6.707 0 019.279 15H8.54c-1.036 0-1.875.84-1.875 1.875V19.5h-.75a.75.75 0 000 1.5h12.17a.75.75 0 000-1.5h-.75v-2.625c0-1.036-.84-1.875-1.875-1.875h-.739a6.707 6.707 0 01-1.112-3.173 6.73 6.73 0 002.743-1.347 6.753 6.753 0 006.139-5.6.75.75 0 00-.585-.858 47.077 47.077 0 00-3.07-.543V2.62a.75.75 0 00-.658-.744 49.22 49.22 0 00-6.093-.377c-2.063 0-4.096.128-6.093.377a.75.75 0 00-.657.744zm0 2.629c0 3.047 1.791 5.678 4.381 6.894a5.21 5.21 0 01-1.028-.737 5.25 5.25 0 01-1.853-3.998V5.25H5.166zm13.668 0v2.159a5.25 5.25 0 01-1.853 3.998 5.21 5.21 0 01-1.028.737c2.59-1.216 4.38-3.847 4.38-6.894h-1.5z" />
  </svg>
);

export default function PlayoffsPage({ standings }: Props) {
  const bracket = useMemo(() => buildBracket(standings), [standings]);
  const [selectedMatchup, setSelectedMatchup] = useState<Matchup | null>(null);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <div className="bg-avs-dark rounded-xl p-6 card-glow overflow-x-auto">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-avs-burgundy rounded-full" />
              2026 Stanley Cup Playoffs — Projected Bracket
            </h2>

            {/* Conference labels */}
            <div className="flex justify-between mb-2 px-1">
              <div className="text-xs text-avs-silver uppercase tracking-wider font-semibold">Western Conference</div>
              <div className="text-xs text-avs-silver uppercase tracking-wider font-semibold">Eastern Conference</div>
            </div>

            <div className="flex items-center" style={{ minHeight: 460 }}>
              {/* === WESTERN === */}
              {/* R1 */}
              <div className="flex flex-col justify-between h-[440px] flex-1 min-w-0">
                {bracket.west.map((m) => (
                  <BracketMatchup key={m.id} matchup={m} selected={selectedMatchup?.id === m.id} onClick={() => setSelectedMatchup(m)} />
                ))}
              </div>

              {/* Connectors R1 -> R2 */}
              <div className="flex flex-col justify-between h-[440px] w-[16px] shrink-0">
                <Connector direction="right" />
                <Connector direction="right" />
              </div>

              {/* R2 */}
              <div className="flex flex-col justify-around h-[440px] w-[110px] shrink-0">
                <Placeholder label="West R2" />
                <Placeholder label="West R2" />
              </div>

              {/* Connectors R2 -> CF */}
              <div className="flex flex-col justify-around h-[440px] w-[16px] shrink-0">
                <ConnectorLarge direction="right" />
              </div>

              {/* WCF */}
              <div className="flex flex-col justify-center h-[440px] w-[110px] shrink-0">
                <Placeholder label="West Final" />
              </div>

              {/* WCF + Cup Final + ECF center column */}
              <div className="flex flex-col items-center h-[440px] w-[140px] shrink-0">
                {/* Cup Final at top */}
                <div className="pt-4 w-full px-2">
                  <div className="text-[10px] text-avs-silver uppercase tracking-wider mb-1 font-semibold text-center">Cup Final</div>
                  <div className="rounded-lg overflow-hidden border border-dashed border-white/20">
                    <div className="flex items-center justify-center px-3 py-2.5 bg-avs-darker/30">
                      <span className="text-xs text-avs-silver/40">TBD</span>
                    </div>
                    <div className="flex items-center justify-center px-3 py-2.5 bg-avs-darker/15">
                      <span className="text-xs text-avs-silver/40">TBD</span>
                    </div>
                    <div className="text-[9px] text-avs-silver/30 text-center py-1">Stanley Cup</div>
                  </div>
                </div>
                {/* Inverted T connector - overflows to reach conference final boxes */}
                <div className="flex-1 w-full" style={{ overflow: "visible" }}>
                  <svg viewBox="0 0 140 100" className="w-full h-full" style={{ overflow: "visible" }} preserveAspectRatio="none">
                    {/* Vertical line down from cup final */}
                    <line x1="70" y1="0" x2="70" y2="50" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                    {/* Horizontal bar extending into conference final boxes */}
                    <line x1="-55" y1="50" x2="195" y2="50" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                  </svg>
                </div>
              </div>

              {/* ECF */}
              <div className="flex flex-col justify-center h-[440px] w-[110px] shrink-0">
                <Placeholder label="East Final" />
              </div>

              {/* Connectors CF -> R2 */}
              <div className="flex flex-col justify-around h-[440px] w-[16px] shrink-0">
                <ConnectorLarge direction="left" />
              </div>

              {/* R2 */}
              <div className="flex flex-col justify-around h-[440px] w-[110px] shrink-0">
                <Placeholder label="East R2" />
                <Placeholder label="East R2" />
              </div>

              {/* Connectors R2 -> R1 */}
              <div className="flex flex-col justify-between h-[440px] w-[16px] shrink-0">
                <Connector direction="left" />
                <Connector direction="left" />
              </div>

              {/* === EASTERN R1 === */}
              <div className="flex flex-col justify-between h-[480px] w-[160px] shrink-0">
                {bracket.east.map((m) => (
                  <BracketMatchup key={m.id} matchup={m} selected={selectedMatchup?.id === m.id} onClick={() => setSelectedMatchup(m)} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Matchup Detail */}
        <div>
          {selectedMatchup ? (
            <MatchupDetail matchup={selectedMatchup} />
          ) : (
            <div className="bg-avs-dark rounded-xl p-6 card-glow text-center h-full flex items-center justify-center">
              <div className="text-avs-silver/50">
                <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
                <p className="text-sm">Select a matchup to see the breakdown</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="text-center">
        <p className="text-avs-silver/50 text-[10px] italic">
          Projected bracket based on current standings. Seedings update as the regular season progresses.
        </p>
      </div>
    </div>
  );
}


/* Bracket connectors */
function Connector({ direction = "right" }: { direction?: "left" | "right" }) {
  // "right" = bracket opens left, output goes right (Western style)
  // "left" = bracket opens right, output goes left (Eastern style, mirrored)
  return (
    <div className="flex-1 flex flex-col justify-center">
      <svg viewBox="0 0 20 120" className="w-full h-[120px]" preserveAspectRatio="none">
        {direction === "right" ? (
          <>
            <path d="M0,30 L10,30 L10,90 L0,90" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
            <path d="M10,60 L20,60" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          </>
        ) : (
          <>
            <path d="M20,30 L10,30 L10,90 L20,90" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
            <path d="M0,60 L10,60" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          </>
        )}
      </svg>
    </div>
  );
}

function ConnectorLarge({ direction = "right" }: { direction?: "left" | "right" }) {
  return (
    <svg viewBox="0 0 20 240" className="w-full h-[240px]" preserveAspectRatio="none">
      {direction === "right" ? (
        <>
          <path d="M0,60 L10,60 L10,180 L0,180" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          <path d="M10,120 L20,120" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
        </>
      ) : (
        <>
          <path d="M20,60 L10,60 L10,180 L20,180" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          <path d="M0,120 L10,120" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
        </>
      )}
    </svg>
  );
}


function BracketMatchup({ matchup, selected, onClick }: { matchup: Matchup; selected: boolean; onClick: () => void }) {
  const isCOL = matchup.home.team.teamAbbrev?.default === "COL" || matchup.away.team.teamAbbrev?.default === "COL";
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-lg overflow-hidden transition-all ${
        selected ? "ring-2 ring-avs-burgundy shadow-lg shadow-avs-burgundy/20"
        : isCOL ? "ring-1 ring-avs-burgundy/30 hover:ring-avs-burgundy/60"
        : "hover:ring-1 hover:ring-white/20"
      }`}
    >
      <SeedRow team={matchup.home.team} seed={matchup.home.label} isTop />
      <SeedRow team={matchup.away.team} seed={matchup.away.label} isTop={false} />
    </button>
  );
}

function SeedRow({ team, seed, isTop }: { team: StandingsTeam; seed: string; isTop: boolean }) {
  const isCOL = team.teamAbbrev?.default === "COL";
  return (
    <div className={`flex items-center gap-1.5 px-2 py-1.5 ${isTop ? "bg-avs-darker" : "bg-avs-darker/60"} ${isCOL ? "bg-avs-burgundy/15" : ""}`}>
      <span className="text-[9px] text-avs-silver w-6 text-center font-mono">{seed}</span>
      <img src={team.teamLogo} alt="" className="w-5 h-5" />
      <span className={`text-xs flex-1 text-left truncate ${isCOL ? "font-bold" : "font-medium"}`}>
        {team.teamAbbrev?.default}
      </span>
      <span className="text-[10px] text-avs-silver">{team.points}</span>
    </div>
  );
}

function Placeholder({ label }: { label: string }) {
  return (
    <div className="rounded-lg overflow-hidden border border-dashed border-white/10">
      <div className="flex items-center justify-center px-2 py-1.5 bg-avs-darker/30">
        <span className="text-[9px] text-avs-silver/30">TBD</span>
      </div>
      <div className="flex items-center justify-center px-2 py-1.5 bg-avs-darker/15">
        <span className="text-[9px] text-avs-silver/30">TBD</span>
      </div>
      <div className="text-[8px] text-avs-silver/20 text-center py-0.5">{label}</div>
    </div>
  );
}


function MatchupDetail({ matchup }: { matchup: Matchup }) {
  const h = matchup.home.team;
  const a = matchup.away.team;

  const stats = [
    { label: "Points", home: h.points, away: a.points },
    { label: "Wins", home: h.wins, away: a.wins },
    { label: "Goal Diff", home: h.goalDifferential, away: a.goalDifferential, signed: true },
    { label: "Goals For", home: h.goalFor, away: a.goalFor },
    { label: "Goals Against", home: h.goalAgainst, away: a.goalAgainst, lower: true },
    { label: "Point %", home: (h.pointPctg * 100).toFixed(1), away: (a.pointPctg * 100).toFixed(1) },
    { label: "Last 10", home: `${h.l10Wins}-${h.l10Losses}-${h.l10OtLosses}`, away: `${a.l10Wins}-${a.l10Losses}-${a.l10OtLosses}` },
    { label: "Streak", home: `${h.streakCode}${h.streakCount}`, away: `${a.streakCode}${a.streakCount}` },
  ];

  return (
    <div className="bg-avs-dark rounded-xl p-6 card-glow space-y-5 h-full">
      <div className="text-center">
        <div className="text-xs text-avs-silver uppercase tracking-wider mb-3">Round 1 Matchup</div>
        <div className="flex items-center justify-center gap-4">
          <div className="text-center">
            <img src={h.teamLogo} alt="" className="w-14 h-14 mx-auto" />
            <div className="font-bold mt-1">{h.teamAbbrev?.default}</div>
            <div className="text-[10px] text-avs-silver">{matchup.home.label}</div>
          </div>
          <div className="text-2xl font-extrabold text-avs-silver/30">vs</div>
          <div className="text-center">
            <img src={a.teamLogo} alt="" className="w-14 h-14 mx-auto" />
            <div className="font-bold mt-1">{a.teamAbbrev?.default}</div>
            <div className="text-[10px] text-avs-silver">{matchup.away.label}</div>
          </div>
        </div>
      </div>

      <div className="space-y-2.5">
        {stats.map((s) => {
          const hVal = typeof s.home === "number" ? s.home : parseFloat(String(s.home));
          const aVal = typeof s.away === "number" ? s.away : parseFloat(String(s.away));
          const hBetter = s.lower ? hVal < aVal : hVal > aVal;
          const aBetter = s.lower ? aVal < hVal : aVal > hVal;
          const isNumeric = !isNaN(hVal) && !isNaN(aVal) && (hVal + aVal) > 0;

          return (
            <div key={s.label} className="space-y-0.5">
              <div className="text-[10px] text-avs-silver/60 text-center uppercase tracking-wider">{s.label}</div>
              <div className="flex items-center gap-2 text-sm">
                <div className={`w-16 text-right font-mono ${isNumeric && hBetter ? "text-green-400 font-semibold" : "text-avs-silver"}`}>
                  {s.signed && typeof s.home === "number" && s.home > 0 ? "+" : ""}{s.home}
                </div>
                {isNumeric ? (
                  <div className="flex-1 h-1.5 bg-avs-darker rounded-full overflow-hidden flex">
                    <div className={`h-full rounded-l-full ${hBetter ? "bg-green-500" : "bg-avs-silver/30"}`} style={{ width: `${(hVal / (hVal + aVal)) * 100}%` }} />
                    <div className={`h-full rounded-r-full ${aBetter ? "bg-green-500" : "bg-avs-silver/30"}`} style={{ width: `${(aVal / (hVal + aVal)) * 100}%` }} />
                  </div>
                ) : (
                  <div className="flex-1 h-1.5" />
                )}
                <div className={`w-16 text-left font-mono ${isNumeric && aBetter ? "text-green-400 font-semibold" : "text-avs-silver"}`}>
                  {s.signed && typeof s.away === "number" && s.away > 0 ? "+" : ""}{s.away}
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
