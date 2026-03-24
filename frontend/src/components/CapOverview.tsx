import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { CapSeason } from "../types";

interface Props {
  seasons: CapSeason[];
}

const fmt = (v: number) => `$${(v / 1_000_000).toFixed(1)}M`;

export default function CapOverview({ seasons }: Props) {
  const data = seasons.map((s) => ({
    season: s.season.replace("20", "'").replace("-20", "-'"),
    "Cap Hit": s.projected_cap_hit,
    "Cap Space": s.projected_cap_space,
    "Salary Cap": s.salary_cap,
  }));

  const currentSeason = seasons[0];

  return (
    <div className="bg-avs-dark rounded-xl p-6 card-glow h-full flex flex-col">
      <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
        <span className="w-1 h-6 bg-avs-burgundy rounded-full" />
        Salary Cap Outlook
      </h2>

      {/* Current season summary cards */}
      {currentSeason && (
        <div className="grid grid-cols-4 gap-3 mb-4">
          <MiniCard
            label="Salary Cap"
            value={fmt(currentSeason.salary_cap)}
            color="text-white"
          />
          <MiniCard
            label="Projected Hit"
            value={fmt(currentSeason.projected_cap_hit)}
            color="text-avs-burgundy"
          />
          <MiniCard
            label="Cap Space"
            value={fmt(currentSeason.projected_cap_space)}
            color={currentSeason.projected_cap_space > 0 ? "text-green-400" : "text-red-400"}
          />
          <MiniCard
            label="LTIR"
            value={fmt(currentSeason.ltir)}
            color="text-yellow-400"
          />
        </div>
      )}

      {/* Chart */}
      <div className="flex-1 min-h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
          <XAxis dataKey="season" tick={{ fill: "#A2AAAD", fontSize: 12 }} />
          <YAxis
            tickFormatter={(v) => `$${v / 1_000_000}M`}
            tick={{ fill: "#A2AAAD", fontSize: 11 }}
          />
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
          <Legend wrapperStyle={{ color: "#A2AAAD", fontSize: 12 }} />
          <ReferenceLine y={0} stroke="#ffffff20" />
          <Bar dataKey="Cap Hit" fill="#6F263D" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Cap Space" fill="#236192" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
}

function MiniCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-avs-darker rounded-lg p-3 text-center">
      <div className={`text-lg font-bold ${color}`}>{value}</div>
      <div className="text-[10px] text-avs-silver uppercase tracking-wider">{label}</div>
    </div>
  );
}
