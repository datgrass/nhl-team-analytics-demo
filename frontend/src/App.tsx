import { useEffect, useState, useCallback } from "react";
import type { Skater, Goalie, Game, StandingsTeam, CapSeason, Contract } from "./types";
import Sidebar from "./components/Sidebar";
import TeamHeader from "./components/TeamHeader";
import MainPage from "./pages/MainPage";
import RosterPage from "./pages/RosterPage";
import ContractsPage from "./pages/ContractsPage";
import VideoReviewPage from "./pages/VideoReviewPage";
import AIChatPage from "./pages/AIChatPage";

export type Page = "main" | "roster" | "contracts" | "video" | "ai";

function App() {
  const [skaters, setSkaters] = useState<Skater[]>([]);
  const [goalies, setGoalies] = useState<Goalie[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [allStandings, setAllStandings] = useState<StandingsTeam[]>([]);
  const [capSeasons, setCapSeasons] = useState<CapSeason[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamRecord, setTeamRecord] = useState({ wins: 0, losses: 0, otl: 0, points: 0 });
  const [page, setPage] = useState<Page>("main");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dataSource, setDataSource] = useState<string>("loading");
  const [lastIngested, setLastIngested] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAll() {
      try {
        const [statsRes, scheduleRes, standingsRes, capRes, contractsRes] = await Promise.all([
          fetch("/api/stats").then((r) => r.json()),
          fetch("/api/schedule").then((r) => r.json()),
          fetch("/api/standings").then((r) => r.json()),
          fetch("/api/cap").then((r) => r.json()),
          fetch("/api/contracts").then((r) => r.json()),
        ]);

        setSkaters(statsRes.skaters || []);
        setGoalies(statsRes.goalies || []);
        setGames(scheduleRes.games || []);
        setCapSeasons(capRes.seasons || []);
        setContracts(contractsRes.contracts || contractsRes || []);

        // Track data source
        setDataSource(statsRes.source || "nhl_api");

        const allTeams: StandingsTeam[] = standingsRes.standings || [];
        setAllStandings(allTeams);

        const col = allTeams.find((t) => t.teamAbbrev?.default === "COL");
        if (col) {
          setTeamRecord({
            wins: col.wins,
            losses: col.losses,
            otl: col.otLosses,
            points: col.points,
          });
        }

        // Check pipeline status
        try {
          const pipeline = await fetch("/api/pipeline-status").then((r) => r.json());
          if (pipeline.last_ingested) {
            setLastIngested(pipeline.last_ingested);
            setDataSource("databricks");
          }
        } catch {}
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-avs-darker">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-avs-burgundy border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-avs-silver text-lg">Loading NHL Analytics...</p>
        </div>
      </div>
    );
  }

  const now = new Date();
  const upcoming = games.filter((g) => new Date(g.startTimeUTC) > now).slice(0, 10);
  const recent = games.filter((g) => g.gameState === "FINAL" || g.gameState === "OFF").slice(-5);

  return (
    <div className="min-h-screen bg-avs-darker flex">
      <Sidebar page={page} setPage={setPage} open={sidebarOpen} setOpen={setSidebarOpen} />

      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? "ml-56" : "ml-16"}`}>
        <TeamHeader record={teamRecord} standings={allStandings} />

        <div className="max-w-[1600px] mx-auto px-4 pb-8 pt-6">
          {page === "main" && (
            <MainPage
              standings={allStandings}
              upcoming={upcoming}
              recent={recent}
            />
          )}
          {page === "roster" && (
            <RosterPage skaters={skaters} goalies={goalies} />
          )}
          {page === "contracts" && (
            <ContractsPage contracts={contracts} capSeasons={capSeasons} />
          )}
          {page === "video" && <VideoReviewPage />}
          {page === "ai" && <AIChatPage />}

          <div className="text-center py-4 mt-6 border-t border-white/10 space-y-1">
            <p className="text-avs-silver text-sm">
              Powered by{" "}
              <span className="text-red-500 font-semibold">Databricks</span>
              {" "}&middot; Data from NHL Edge API &amp; Puck Pedia
            </p>
            <div className="flex items-center justify-center gap-2 text-xs">
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full ${
                dataSource === "databricks"
                  ? "bg-green-500/15 text-green-400"
                  : "bg-blue-500/15 text-blue-400"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  dataSource === "databricks" ? "bg-green-400" : "bg-blue-400"
                }`} />
                {dataSource === "databricks" ? "Delta Lake" : "Live API"}
              </span>
              {lastIngested && (
                <span className="text-avs-silver/50">
                  Last refresh: {new Date(lastIngested).toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
