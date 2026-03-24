import { useMemo, useState } from "react";
import type { Skater } from "../types";

interface Props {
  skaters: Skater[];
}

type SortKey = "rank" | "name" | "pos" | "gp" | "g" | "a" | "pts" | "pm" | "ppg" | "sog" | "spct" | "toi";

function fmtToi(seconds: number | null | undefined): string {
  if (!seconds) return "-";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function PointLeaders({ skaters }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("pts");
  const [sortAsc, setSortAsc] = useState(false);

  const sorted = useMemo(() => {
    const arr = skaters.map((s, i) => ({ ...s, origRank: i + 1 }));
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "rank": cmp = a.origRank - b.origRank; break;
        case "name": cmp = `${a.firstName.default} ${a.lastName.default}`.localeCompare(`${b.firstName.default} ${b.lastName.default}`); break;
        case "pos": cmp = a.positionCode.localeCompare(b.positionCode); break;
        case "gp": cmp = a.gamesPlayed - b.gamesPlayed; break;
        case "g": cmp = a.goals - b.goals; break;
        case "a": cmp = a.assists - b.assists; break;
        case "pts": cmp = a.points - b.points; break;
        case "pm": cmp = a.plusMinus - b.plusMinus; break;
        case "ppg": cmp = a.powerPlayGoals - b.powerPlayGoals; break;
        case "sog": cmp = a.shots - b.shots; break;
        case "spct": cmp = a.shootingPctg - b.shootingPctg; break;
        case "toi": cmp = (a.avgTimeOnIcePerGame || 0) - (b.avgTimeOnIcePerGame || 0); break;
      }
      return sortAsc ? cmp : -cmp;
    });
    return arr;
  }, [skaters, sortKey, sortAsc]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  }

  const arrow = (key: SortKey) => sortKey === key ? (sortAsc ? " \u25B2" : " \u25BC") : "";

  return (
    <div className="bg-avs-dark rounded-xl p-6 card-glow">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <span className="w-1 h-6 bg-avs-burgundy rounded-full" />
        Team Leaders
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-avs-silver text-xs uppercase border-b border-white/10">
              <Th label="#" k="rank" cur={sortKey} asc={sortAsc} toggle={toggleSort} arrow={arrow} />
              <Th label="Player" k="name" cur={sortKey} asc={sortAsc} toggle={toggleSort} arrow={arrow} align="left" />
              <Th label="Pos" k="pos" cur={sortKey} asc={sortAsc} toggle={toggleSort} arrow={arrow} />
              <Th label="GP" k="gp" cur={sortKey} asc={sortAsc} toggle={toggleSort} arrow={arrow} />
              <Th label="G" k="g" cur={sortKey} asc={sortAsc} toggle={toggleSort} arrow={arrow} color="text-yellow-400" />
              <Th label="A" k="a" cur={sortKey} asc={sortAsc} toggle={toggleSort} arrow={arrow} color="text-blue-400" />
              <Th label="PTS" k="pts" cur={sortKey} asc={sortAsc} toggle={toggleSort} arrow={arrow} color="text-green-400" bold />
              <Th label="+/-" k="pm" cur={sortKey} asc={sortAsc} toggle={toggleSort} arrow={arrow} />
              <Th label="PPG" k="ppg" cur={sortKey} asc={sortAsc} toggle={toggleSort} arrow={arrow} />
              <Th label="SOG" k="sog" cur={sortKey} asc={sortAsc} toggle={toggleSort} arrow={arrow} />
              <Th label="S%" k="spct" cur={sortKey} asc={sortAsc} toggle={toggleSort} arrow={arrow} />
              <Th label="TOI" k="toi" cur={sortKey} asc={sortAsc} toggle={toggleSort} arrow={arrow} />
            </tr>
          </thead>
          <tbody>
            {sorted.map((s, i) => (
              <tr
                key={s.playerId}
                className={`border-b border-white/5 hover:bg-white/5 transition-colors ${
                  i < 3 ? "bg-avs-burgundy/10" : ""
                }`}
              >
                <td className="py-2 pr-2 text-avs-silver text-center">{i + 1}</td>
                <td className="py-2">
                  <div className="flex items-center gap-3">
                    <img src={s.headshot} alt="" className="w-8 h-8 rounded-full bg-avs-darker object-cover" />
                    <span className="font-medium">{s.firstName.default} {s.lastName.default}</span>
                  </div>
                </td>
                <td className="text-center text-avs-silver">{s.positionCode}</td>
                <td className="text-center">{s.gamesPlayed}</td>
                <td className="text-center text-yellow-400 font-semibold">{s.goals}</td>
                <td className="text-center text-blue-400">{s.assists}</td>
                <td className="text-center text-green-400 font-bold text-base">{s.points}</td>
                <td className={`text-center ${s.plusMinus > 0 ? "text-green-400" : s.plusMinus < 0 ? "text-red-400" : "text-avs-silver"}`}>
                  {s.plusMinus > 0 ? "+" : ""}{s.plusMinus}
                </td>
                <td className="text-center">{s.powerPlayGoals}</td>
                <td className="text-center">{s.shots}</td>
                <td className="text-center text-avs-silver">{(s.shootingPctg * 100).toFixed(1)}%</td>
                <td className="text-center text-avs-silver">{fmtToi(s.avgTimeOnIcePerGame)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ label, k, cur, asc, toggle, arrow, align, color, bold }: {
  label: string; k: SortKey; cur: SortKey; asc: boolean;
  toggle: (k: SortKey) => void; arrow: (k: SortKey) => string;
  align?: "left"; color?: string; bold?: boolean;
}) {
  const active = cur === k;
  return (
    <th
      className={`py-2 cursor-pointer select-none hover:text-white transition-colors ${
        align === "left" ? "text-left" : "text-center"
      } ${color || ""} ${bold ? "font-bold" : ""} ${active ? "text-white" : ""}`}
      onClick={() => toggle(k)}
    >
      {label}<span className="text-[10px]">{arrow(k)}</span>
    </th>
  );
}
