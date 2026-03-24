import type { Goalie } from "../types";

interface Props {
  goalies: Goalie[];
}

export default function GoalieStats({ goalies }: Props) {
  return (
    <div className="bg-avs-dark rounded-xl p-5 card-glow">
      <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
        <span className="w-1 h-5 bg-avs-blue rounded-full" />
        Goaltenders
      </h2>
      <div className="space-y-2.5">
        {goalies.map((g) => (
          <div
            key={g.playerId}
            className="bg-avs-darker rounded-lg px-3 py-2.5 flex items-center gap-3"
          >
            <img
              src={g.headshot}
              alt=""
              className="w-10 h-10 rounded-full bg-avs-dark object-cover shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm">
                {g.firstName.default} {g.lastName.default}
              </div>
              <div className="text-avs-silver text-xs">
                {g.wins}W-{g.losses}L-{g.overtimeLosses || 0}OTL &middot; {g.gamesPlayed} GP
              </div>
            </div>
            <div className="flex gap-3 text-center shrink-0">
              <div>
                <div className="text-sm font-bold text-green-400">{g.goalsAgainstAverage.toFixed(2)}</div>
                <div className="text-[9px] text-avs-silver uppercase">GAA</div>
              </div>
              <div>
                <div className="text-sm font-bold text-blue-400">{(g.savePercentage * 100).toFixed(1)}%</div>
                <div className="text-[9px] text-avs-silver uppercase">SV%</div>
              </div>
              <div>
                <div className="text-sm font-bold text-yellow-400">{g.shutouts}</div>
                <div className="text-[9px] text-avs-silver uppercase">SO</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
