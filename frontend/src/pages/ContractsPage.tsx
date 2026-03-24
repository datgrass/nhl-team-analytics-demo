import type { CapSeason, Contract } from "../types";
import CapOverview from "../components/CapOverview";
import CapBreakdown from "../components/CapBreakdown";
import PlayerContracts from "../components/PlayerContracts";

interface Props {
  contracts: Contract[];
  capSeasons: CapSeason[];
}

export default function ContractsPage({ contracts, capSeasons }: Props) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CapOverview seasons={capSeasons} />
        </div>
        <div>
          <CapBreakdown seasons={capSeasons} />
        </div>
      </div>
      <PlayerContracts contracts={contracts} />
    </div>
  );
}
