import { useState } from "react";
import type { Contract } from "../types";

interface Props {
  contracts: Contract[];
}

type SortKey = "name" | "position" | "cap_hit" | "expiry" | "games";

const fmt = (v: number) => `$${(v / 1_000_000).toFixed(2)}M`;

export default function PlayerContracts({ contracts }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("cap_hit");
  const [sortAsc, setSortAsc] = useState(false);
  const [posFilter, setPosFilter] = useState<string>("ALL");

  // Flatten contracts to rows
  const rows = contracts
    .filter((c) => c.current && c.current.length > 0)
    .map((c) => {
      const contract = c.current[0];
      const currentYear = contract?.years?.find((y) => y.season === "2025-2026") || contract?.years?.[0];
      const capHit = currentYear ? parseFloat(currentYear.cap_hit) : 0;
      const aav = currentYear ? parseFloat(currentYear.aav) : 0;

      return {
        id: c.player_id,
        name: `${c.first_name} ${c.last_name}`,
        position: c.position_detail || c.position,
        posGroup: /goaltender/i.test(c.position) ? "G" : /defense/i.test(c.position) ? "D" : "F",
        jersey: c.jersey_number,
        games: c.nhl_games,
        capHit,
        aav,
        type: contract.contract_type,
        length: contract.length,
        expiry: contract.contract_end,
        expiryStatus: contract.expiry_status,
        signingStatus: contract.signing_status,
        totalValue: contract.value ? parseFloat(contract.value) : 0,
      };
    })
    .filter((r) => r.capHit > 0);

  // Filter
  const filtered = posFilter === "ALL" ? rows : rows.filter((r) => r.posGroup === posFilter);

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    switch (sortKey) {
      case "name": cmp = a.name.localeCompare(b.name); break;
      case "position": cmp = a.position.localeCompare(b.position); break;
      case "cap_hit": cmp = a.capHit - b.capHit; break;
      case "expiry": cmp = (a.expiry || "").localeCompare(b.expiry || ""); break;
      case "games": cmp = a.games - b.games; break;
    }
    return sortAsc ? cmp : -cmp;
  });

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
          Player Contracts
        </h2>
        <div className="flex gap-2">
          {["ALL", "F", "D", "G"].map((p) => (
            <button
              key={p}
              onClick={() => setPosFilter(p)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                posFilter === p
                  ? "bg-avs-burgundy text-white"
                  : "bg-avs-darker text-avs-silver hover:bg-white/10"
              }`}
            >
              {p === "ALL" ? "All" : p === "F" ? "Forwards" : p === "D" ? "Defense" : "Goalies"}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-avs-dark z-10">
            <tr className="text-avs-silver text-xs uppercase border-b border-white/10">
              <th className="text-left py-2 cursor-pointer hover:text-white" onClick={() => toggleSort("name")}>
                Player{arrow("name")}
              </th>
              <th className="text-center py-2 cursor-pointer hover:text-white" onClick={() => toggleSort("position")}>
                Pos{arrow("position")}
              </th>
              <th className="text-center py-2">#</th>
              <th className="text-center py-2 cursor-pointer hover:text-white" onClick={() => toggleSort("games")}>
                GP{arrow("games")}
              </th>
              <th className="text-center py-2 cursor-pointer hover:text-white text-yellow-400" onClick={() => toggleSort("cap_hit")}>
                Cap Hit{arrow("cap_hit")}
              </th>
              <th className="text-center py-2">AAV</th>
              <th className="text-center py-2">Type</th>
              <th className="text-center py-2">Length</th>
              <th className="text-center py-2 cursor-pointer hover:text-white" onClick={() => toggleSort("expiry")}>
                Expiry{arrow("expiry")}
              </th>
              <th className="text-center py-2">Status</th>
              <th className="text-center py-2">Total Value</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr
                key={r.id}
                className="border-b border-white/5 hover:bg-white/5 transition-colors"
              >
                <td className="py-2 font-medium">{r.name}</td>
                <td className="text-center text-avs-silver">{r.position}</td>
                <td className="text-center text-avs-silver">{r.jersey || "-"}</td>
                <td className="text-center">{r.games}</td>
                <td className="text-center text-yellow-400 font-semibold">{fmt(r.capHit)}</td>
                <td className="text-center">{fmt(r.aav)}</td>
                <td className="text-center text-avs-silver text-xs">{r.type}</td>
                <td className="text-center">{r.length}yr</td>
                <td className="text-center text-avs-silver">{r.expiry || "-"}</td>
                <td className="text-center">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      r.expiryStatus === "UFA"
                        ? "bg-red-500/20 text-red-400"
                        : r.expiryStatus === "RFA"
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-avs-darker text-avs-silver"
                    }`}
                  >
                    {r.expiryStatus || "-"}
                  </span>
                </td>
                <td className="text-center">{r.totalValue > 0 ? fmt(r.totalValue) : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="text-avs-silver text-xs mt-3">
        Showing {sorted.length} of {rows.length} contracts
      </div>
    </div>
  );
}
