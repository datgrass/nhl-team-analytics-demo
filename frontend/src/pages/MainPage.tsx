import type { Game, StandingsTeam } from "../types";
import StandingsView from "../components/StandingsView";
import Schedule from "../components/Schedule";

interface Props {
  standings: StandingsTeam[];
  upcoming: Game[];
  recent: Game[];
}

export default function MainPage({ standings, upcoming, recent }: Props) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Standings - takes 2/3 */}
        <div className="lg:col-span-2">
          <StandingsView teams={standings} />
        </div>
        {/* Schedule - takes 1/3 */}
        <div>
          <Schedule upcoming={upcoming} recent={recent} />
        </div>
      </div>
    </div>
  );
}
