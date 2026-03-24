import type { PlayByPlayEvent } from "../types";

interface Props {
  events: PlayByPlayEvent[];
  selectedEvent: PlayByPlayEvent | null;
  homeTeam: any;
  awayTeam: any;
}

const EVENT_COLORS: Record<string, string> = {
  goal: "#22c55e",
  "shot-on-goal": "#3b82f6",
  hit: "#f97316",
  penalty: "#ef4444",
  takeaway: "#10b981",
  giveaway: "#eab308",
  "blocked-shot": "#a855f7",
  "missed-shot": "#6b7280",
};

export default function IceRink({ events, selectedEvent, homeTeam, awayTeam }: Props) {
  // NHL rink coords: x from -100 to 100, y from -42.5 to 42.5
  const W = 400;
  const H = 170;
  const padX = 10;
  const padY = 10;

  function toSvg(x: number, y: number): { cx: number; cy: number } {
    return {
      cx: padX + ((x + 100) / 200) * (W - 2 * padX),
      cy: padY + ((y + 42.5) / 85) * (H - 2 * padY),
    };
  }

  // Only plot events that have coordinates
  const plottable = events.filter(
    (e) => e.details?.xCoord != null && e.details?.yCoord != null
  );

  return (
    <div className="bg-avs-dark rounded-xl p-5 card-glow">
      <h3 className="text-sm text-avs-silver uppercase tracking-wider mb-3">Ice Rink</h3>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 250 }}>
        {/* Rink outline */}
        <rect
          x={padX}
          y={padY}
          width={W - 2 * padX}
          height={H - 2 * padY}
          rx={30}
          ry={30}
          fill="#1a3a5c"
          stroke="#4a7aa7"
          strokeWidth={1.5}
        />

        {/* Center line */}
        <line x1={W / 2} y1={padY} x2={W / 2} y2={H - padY} stroke="#ef4444" strokeWidth={1.5} />

        {/* Blue lines */}
        <line x1={W * 0.325} y1={padY} x2={W * 0.325} y2={H - padY} stroke="#3b82f6" strokeWidth={1.5} />
        <line x1={W * 0.675} y1={padY} x2={W * 0.675} y2={H - padY} stroke="#3b82f6" strokeWidth={1.5} />

        {/* Center circle */}
        <circle cx={W / 2} cy={H / 2} r={15} fill="none" stroke="#3b82f6" strokeWidth={0.8} />

        {/* Goal creases */}
        <rect x={padX + 3} y={H / 2 - 8} width={6} height={16} rx={1} fill="none" stroke="#ef4444" strokeWidth={0.8} />
        <rect x={W - padX - 9} y={H / 2 - 8} width={6} height={16} rx={1} fill="none" stroke="#ef4444" strokeWidth={0.8} />

        {/* Faceoff circles */}
        {[
          { x: W * 0.225, y: H * 0.3 },
          { x: W * 0.225, y: H * 0.7 },
          { x: W * 0.775, y: H * 0.3 },
          { x: W * 0.775, y: H * 0.7 },
        ].map((c, i) => (
          <circle key={i} cx={c.x} cy={c.y} r={10} fill="none" stroke="#ef4444" strokeWidth={0.5} opacity={0.5} />
        ))}

        {/* Event dots */}
        {plottable.map((e) => {
          const { cx, cy } = toSvg(e.details!.xCoord!, e.details!.yCoord!);
          const color = EVENT_COLORS[e.typeDescKey] || "#6b7280";
          const isGoal = e.typeDescKey === "goal";
          const isSelected = selectedEvent?.eventId === e.eventId;
          const r = isGoal ? 5 : isSelected ? 4 : 2.5;

          return (
            <g key={e.eventId}>
              {isSelected && (
                <circle cx={cx} cy={cy} r={r + 4} fill="none" stroke="#fff" strokeWidth={1.5} opacity={0.8}>
                  <animate attributeName="r" values={`${r + 3};${r + 6};${r + 3}`} dur="1.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.8;0.3;0.8" dur="1.5s" repeatCount="indefinite" />
                </circle>
              )}
              <circle
                cx={cx}
                cy={cy}
                r={r}
                fill={color}
                opacity={isSelected ? 1 : 0.7}
                stroke={isSelected ? "#fff" : "none"}
                strokeWidth={isSelected ? 1 : 0}
              />
              {isGoal && (
                <circle cx={cx} cy={cy} r={r + 2} fill="none" stroke={color} strokeWidth={0.8} opacity={0.5} />
              )}
            </g>
          );
        })}

        {/* Team labels */}
        <text x={padX + 15} y={H - padY - 5} fill="#ffffff80" fontSize={9} fontWeight={600}>
          {awayTeam?.abbrev || "AWAY"}
        </text>
        <text x={W - padX - 35} y={H - padY - 5} fill="#ffffff80" fontSize={9} fontWeight={600}>
          {homeTeam?.abbrev || "HOME"}
        </text>
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 justify-center">
        {Object.entries(EVENT_COLORS)
          .filter(([k]) => ["goal", "shot-on-goal", "hit", "penalty"].includes(k))
          .map(([key, color]) => (
            <div key={key} className="flex items-center gap-1 text-[10px] text-avs-silver">
              <div className="w-2 h-2 rounded-full" style={{ background: color }} />
              <span className="capitalize">{key.replace(/-/g, " ")}</span>
            </div>
          ))}
      </div>
    </div>
  );
}
