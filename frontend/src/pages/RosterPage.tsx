import type { Skater, Goalie } from "../types";
import PointLeaders from "../components/PointLeaders";
import GoalieStats from "../components/GoalieStats";
import InjuryReport from "../components/InjuryReport";

interface Props {
  skaters: Skater[];
  goalies: Goalie[];
}

export default function RosterPage({ skaters, goalies }: Props) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PointLeaders skaters={skaters} />
        </div>
        <div className="space-y-6">
          <GoalieStats goalies={goalies} />
          <InjuryReport />
        </div>
      </div>
    </div>
  );
}
