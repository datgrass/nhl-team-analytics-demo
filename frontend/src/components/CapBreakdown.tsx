import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { CapSeason } from "../types";

interface Props {
  seasons: CapSeason[];
}

const COLORS = ["#6F263D", "#236192", "#A2AAAD"];
const fmt = (v: number) => `$${(v / 1_000_000).toFixed(1)}M`;

export default function CapBreakdown({ seasons }: Props) {
  const current = seasons[0];
  if (!current) return null;

  const data = [
    { name: "Forwards", value: current.cap_hit_forwards },
    { name: "Defense", value: current.cap_hit_defence },
    { name: "Goalies", value: current.cap_hit_goalies },
  ];

  const total = current.current_roster_annual_cap_hit;

  return (
    <div className="bg-avs-dark rounded-xl p-6 card-glow h-full flex flex-col">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <span className="w-1 h-6 bg-avs-blue rounded-full" />
        Cap by Position
      </h2>

      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={3}
            dataKey="value"
            strokeWidth={0}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v: number) => fmt(v)}
            contentStyle={{
              background: "#f0f0f5",
              border: "1px solid #6F263D",
              borderRadius: "8px",
              color: "#1a1a2e",
            }}
            labelStyle={{ color: "#1a1a2e", fontWeight: 600 }}
            itemStyle={{ color: "#1a1a2e" }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="space-y-2 mt-2">
        {data.map((d, i) => (
          <div key={d.name} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ background: COLORS[i] }}
              />
              <span>{d.name}</span>
            </div>
            <div className="text-right">
              <span className="font-semibold">{fmt(d.value)}</span>
              <span className="text-avs-silver ml-2 text-xs">
                {((d.value / total) * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Roster Info */}
      <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-2 text-center text-sm">
        <div>
          <div className="font-bold text-lg">{current.roster_count}</div>
          <div className="text-avs-silver text-xs">Roster</div>
        </div>
        <div>
          <div className="font-bold text-lg">{current.contracts}</div>
          <div className="text-avs-silver text-xs">Contracts</div>
        </div>
      </div>
    </div>
  );
}
