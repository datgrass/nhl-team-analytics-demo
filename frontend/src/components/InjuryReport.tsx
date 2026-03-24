import { useEffect, useState } from "react";

interface Injury {
  name: string;
  position: string;
  injury: string;
  status: string;
  timeline: string;
  updated_at?: string;
}

const STATUS_COLORS: Record<string, string> = {
  LTIR: "bg-red-500/20 text-red-400",
  IR: "bg-red-500/20 text-red-400",
  "Week-to-Week": "bg-orange-500/20 text-orange-400",
  Out: "bg-red-500/20 text-red-400",
  "Day-to-Day": "bg-yellow-500/20 text-yellow-400",
  Questionable: "bg-yellow-500/20 text-yellow-400",
};

export default function InjuryReport() {
  const [injuries, setInjuries] = useState<Injury[]>([]);
  const [disclaimer, setDisclaimer] = useState("");
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/injuries")
      .then((r) => r.json())
      .then((data) => {
        setInjuries(data.injuries || []);
        setDisclaimer(data.disclaimer || "");
        const dates = (data.injuries || [])
          .map((i: Injury) => i.updated_at)
          .filter(Boolean)
          .sort()
          .reverse();
        if (dates.length > 0) setLastUpdated(dates[0]);
      })
      .catch(() => {});
  }, []);

  if (injuries.length === 0 && !disclaimer) return null;

  return (
    <div className="bg-avs-dark rounded-xl p-6 card-glow">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <span className="w-1 h-6 bg-red-500 rounded-full" />
        Injury Report
      </h2>
      {injuries.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-avs-silver text-xs uppercase border-b border-white/10">
                <th className="text-left py-2">Player</th>
                <th className="text-center py-2">Pos</th>
                <th className="text-left py-2">Injury</th>
                <th className="text-center py-2">Status</th>
                <th className="text-center py-2">Timeline</th>
              </tr>
            </thead>
            <tbody>
              {injuries.map((p) => (
                <tr key={p.name} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-2.5 font-medium">{p.name}</td>
                  <td className="text-center text-avs-silver">{p.position}</td>
                  <td className="text-avs-silver">{p.injury}</td>
                  <td className="text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[p.status] || "bg-avs-darker text-avs-silver"}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="text-center text-avs-silver">{p.timeline}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-avs-silver text-sm">No injuries to report.</p>
      )}
      {disclaimer && (
        <p className="text-avs-silver/50 text-[10px] mt-3 italic">
          {disclaimer}
          {lastUpdated && ` Last updated: ${new Date(lastUpdated).toLocaleDateString()}.`}
        </p>
      )}
    </div>
  );
}
