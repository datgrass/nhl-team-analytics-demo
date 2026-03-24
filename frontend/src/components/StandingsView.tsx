import { useMemo, useState } from "react";
import type { StandingsTeam } from "../types";

interface Props {
  teams: StandingsTeam[];
}

type View = "division" | "conference" | "league";
type SortKey = "rank" | "team" | "gp" | "w" | "l" | "otl" | "pts" | "ptpct" | "gf" | "ga" | "diff" | "l10" | "strk";

const DIVISIONS = [
  { abbrev: "C", label: "Central" },
  { abbrev: "P", label: "Pacific" },
  { abbrev: "A", label: "Atlantic" },
  { abbrev: "M", label: "Metropolitan" },
];

const CONFERENCES = [
  { name: "Western", label: "Western" },
  { name: "Eastern", label: "Eastern" },
];

export default function StandingsView({ teams }: Props) {
  const [view, setView] = useState<View>("division");
  const [selectedDivision, setSelectedDivision] = useState("C");
  const [selectedConference, setSelectedConference] = useState("Western");
  const [sortKey, setSortKey] = useState<SortKey>("pts");
  const [sortAsc, setSortAsc] = useState(false);

  // Reset sort to pts desc when switching views
  function switchView(v: View) {
    setView(v);
    setSortKey("pts");
    setSortAsc(false);
  }

  const divLabel = DIVISIONS.find((d) => d.abbrev === selectedDivision)?.label ?? selectedDivision;

  let baseFiltered: StandingsTeam[];
  let title: string;

  switch (view) {
    case "division":
      baseFiltered = teams.filter((t) => t.divisionAbbrev === selectedDivision);
      title = `${divLabel} Division`;
      break;
    case "conference":
      baseFiltered = teams.filter((t) => t.conferenceName === selectedConference);
      title = `${selectedConference} Conference`;
      break;
    case "league":
      baseFiltered = [...teams];
      title = "NHL Standings";
      break;
  }

  const sorted = useMemo(() => {
    const arr = [...baseFiltered];
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "rank": cmp = a.divisionSequence - b.divisionSequence; break;
        case "team": cmp = (a.teamName?.default || "").localeCompare(b.teamName?.default || ""); break;
        case "gp": cmp = a.gamesPlayed - b.gamesPlayed; break;
        case "w": cmp = a.wins - b.wins; break;
        case "l": cmp = a.losses - b.losses; break;
        case "otl": cmp = a.otLosses - b.otLosses; break;
        case "pts": cmp = a.points - b.points; break;
        case "ptpct": cmp = a.pointPctg - b.pointPctg; break;
        case "gf": cmp = a.goalFor - b.goalFor; break;
        case "ga": cmp = a.goalAgainst - b.goalAgainst; break;
        case "diff": cmp = a.goalDifferential - b.goalDifferential; break;
        case "l10": cmp = a.l10Wins - b.l10Wins; break;
        case "strk": cmp = a.streakCount - b.streakCount; break;
      }
      return sortAsc ? cmp : -cmp;
    });
    return arr;
  }, [baseFiltered, sortKey, sortAsc]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  }

  const arrow = (key: SortKey) =>
    sortKey === key ? (sortAsc ? " \u25B2" : " \u25BC") : "";

  return (
    <div className="bg-avs-dark rounded-xl p-6 card-glow">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span className="w-1 h-6 bg-avs-burgundy rounded-full" />
          {title}
        </h2>

        <div className="flex items-center gap-3">
          {/* Division / Conference dropdown */}
          {view === "division" && (
            <select
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
              className="bg-avs-darker text-white text-xs font-semibold rounded-lg px-3 py-1.5 border border-white/10 focus:border-avs-burgundy focus:outline-none cursor-pointer"
            >
              {DIVISIONS.map((d) => (
                <option key={d.abbrev} value={d.abbrev}>
                  {d.label}
                </option>
              ))}
            </select>
          )}
          {view === "conference" && (
            <select
              value={selectedConference}
              onChange={(e) => setSelectedConference(e.target.value)}
              className="bg-avs-darker text-white text-xs font-semibold rounded-lg px-3 py-1.5 border border-white/10 focus:border-avs-burgundy focus:outline-none cursor-pointer"
            >
              {CONFERENCES.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.label}
                </option>
              ))}
            </select>
          )}

          {/* View toggle */}
          <div className="flex gap-1 bg-avs-darker rounded-lg p-1">
            {(["division", "conference", "league"] as View[]).map((v) => (
              <button
                key={v}
                onClick={() => switchView(v)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  view === v
                    ? "bg-avs-burgundy text-white shadow-md"
                    : "text-avs-silver hover:text-white hover:bg-white/5"
                }`}
              >
                {v === "division" ? "Division" : v === "conference" ? "Conference" : "League"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-avs-silver text-xs uppercase border-b border-white/10">
              <Th label="#" sortKey="rank" current={sortKey} asc={sortAsc} onClick={toggleSort} arrow={arrow} />
              <Th label="Team" sortKey="team" current={sortKey} asc={sortAsc} onClick={toggleSort} arrow={arrow} align="left" />
              <Th label="GP" sortKey="gp" current={sortKey} asc={sortAsc} onClick={toggleSort} arrow={arrow} />
              <Th label="W" sortKey="w" current={sortKey} asc={sortAsc} onClick={toggleSort} arrow={arrow} />
              <Th label="L" sortKey="l" current={sortKey} asc={sortAsc} onClick={toggleSort} arrow={arrow} />
              <Th label="OTL" sortKey="otl" current={sortKey} asc={sortAsc} onClick={toggleSort} arrow={arrow} />
              <Th label="PTS" sortKey="pts" current={sortKey} asc={sortAsc} onClick={toggleSort} arrow={arrow} highlight />
              <Th label="P%" sortKey="ptpct" current={sortKey} asc={sortAsc} onClick={toggleSort} arrow={arrow} />
              <Th label="GF" sortKey="gf" current={sortKey} asc={sortAsc} onClick={toggleSort} arrow={arrow} />
              <Th label="GA" sortKey="ga" current={sortKey} asc={sortAsc} onClick={toggleSort} arrow={arrow} />
              <Th label="DIFF" sortKey="diff" current={sortKey} asc={sortAsc} onClick={toggleSort} arrow={arrow} />
              <Th label="L10" sortKey="l10" current={sortKey} asc={sortAsc} onClick={toggleSort} arrow={arrow} />
              <Th label="STRK" sortKey="strk" current={sortKey} asc={sortAsc} onClick={toggleSort} arrow={arrow} />
            </tr>
          </thead>
          <tbody>
            {sorted.map((t, i) => {
              const isCOL = t.teamAbbrev?.default === "COL";
              return (
                <tr
                  key={t.teamAbbrev?.default}
                  className={`border-b border-white/5 hover:bg-white/5 transition-colors ${
                    isCOL ? "bg-avs-burgundy/15 font-semibold" : ""
                  }`}
                >
                  <td className="py-2.5 text-avs-silver text-center">{i + 1}</td>
                  <td className="py-2.5">
                    <div className="flex items-center gap-2.5">
                      <img src={t.teamLogo} alt="" className="w-7 h-7" />
                      <span>{t.teamName?.default || t.teamAbbrev?.default}</span>
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
                  <td className="text-center text-avs-silver text-xs">
                    {t.l10Wins}-{t.l10Losses}-{t.l10OtLosses}
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
    </div>
  );
}

function Th({
  label,
  sortKey,
  current,
  asc,
  onClick,
  arrow,
  align,
  highlight,
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  asc: boolean;
  onClick: (k: SortKey) => void;
  arrow: (k: SortKey) => string;
  align?: "left";
  highlight?: boolean;
}) {
  const active = current === sortKey;
  return (
    <th
      className={`py-2 cursor-pointer select-none hover:text-white transition-colors ${
        align === "left" ? "text-left" : "text-center"
      } ${highlight ? "text-yellow-400 font-bold" : ""} ${active ? "text-white" : ""}`}
      onClick={() => onClick(sortKey)}
    >
      {label}
      <span className="text-[10px]">{arrow(sortKey)}</span>
    </th>
  );
}
