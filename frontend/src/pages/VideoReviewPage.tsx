import { useEffect, useState } from "react";
import type { Game, PlayByPlayEvent } from "../types";
import IceRink from "../components/IceRink";
import CommentsPanel from "../components/CommentsPanel";

const EVENT_TYPES: Record<string, { label: string; color: string; icon: string }> = {
  goal: { label: "Goal", color: "bg-green-500", icon: "\u{1F6A8}" },
  "shot-on-goal": { label: "Shot", color: "bg-blue-500", icon: "\u{1F3AF}" },
  hit: { label: "Hit", color: "bg-orange-500", icon: "\u{1F4A5}" },
  penalty: { label: "Penalty", color: "bg-red-500", icon: "\u{1F6D1}" },
  takeaway: { label: "Takeaway", color: "bg-emerald-500", icon: "\u{1F44D}" },
  giveaway: { label: "Giveaway", color: "bg-yellow-500", icon: "\u{274C}" },
  "blocked-shot": { label: "Block", color: "bg-purple-500", icon: "\u{1F6E1}\uFE0F" },
  faceoff: { label: "Faceoff", color: "bg-cyan-500", icon: "\u{1F504}" },
  "missed-shot": { label: "Missed Shot", color: "bg-gray-500", icon: "\u2B55" },
};

const FILTER_KEYS = ["goal", "shot-on-goal", "hit", "penalty", "takeaway", "giveaway", "blocked-shot"];

interface VideoReviewProps {
  initialGameId?: number | null;
  onNavigateToSummary?: (gameId: number) => void;
  onGameChange?: (gameId: number) => void;
  embedded?: boolean;
  externalGameId?: number | null;
}

export default function VideoReviewPage({ initialGameId, onNavigateToSummary, onGameChange, embedded, externalGameId }: VideoReviewProps) {
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<number | null>(initialGameId ?? null);
  const [events, setEvents] = useState<PlayByPlayEvent[]>([]);
  const [players, setPlayers] = useState<Record<number, string>>({});
  const [teams, setTeams] = useState<{ home: any; away: any } | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set(FILTER_KEYS));
  const [selectedEvent, setSelectedEvent] = useState<PlayByPlayEvent | null>(null);
  const [periodFilter, setPeriodFilter] = useState<number | null>(null);
  const [commentCounts, setCommentCounts] = useState<Record<number, number>>({});

  // Sync with external game ID when embedded
  useEffect(() => {
    if (embedded && externalGameId && externalGameId !== selectedGameId) {
      setSelectedGameId(externalGameId);
    }
  }, [embedded, externalGameId]);

  // Load game list (skip when embedded — parent owns the selector)
  useEffect(() => {
    if (embedded) return;
    fetch("/api/games")
      .then((r) => r.json())
      .then((data) => {
        setGames(data);
        if (initialGameId && data.some((g: Game) => g.id === initialGameId)) {
          setSelectedGameId(initialGameId);
        } else if (data.length > 0) {
          setSelectedGameId(data[0].id);
        }
      });
  }, []);

  // Load play-by-play when game changes
  useEffect(() => {
    if (!selectedGameId) return;
    setLoading(true);
    setSelectedEvent(null);
    fetch(`/api/game/${selectedGameId}/play-by-play`)
      .then((r) => r.json())
      .then((data) => {
        // Build player name map
        const pMap: Record<number, string> = {};
        for (const roster of [data.rosterSpots || [], ...(data.rosterSpots ? [] : [])]) {
          for (const p of roster) {
            pMap[p.playerId] = `${p.firstName?.default || ""} ${p.lastName?.default || ""}`.trim();
          }
        }
        // Also try from roster spots
        if (data.rosterSpots) {
          for (const p of data.rosterSpots) {
            pMap[p.playerId] = `${p.firstName?.default || ""} ${p.lastName?.default || ""}`.trim();
          }
        }
        setPlayers(pMap);
        setTeams({ home: data.homeTeam, away: data.awayTeam });

        const plays: PlayByPlayEvent[] = data.plays || [];
        setEvents(plays);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedGameId]);

  const toggleFilter = (key: string, e: React.MouseEvent) => {
    if (e.shiftKey) {
      // Shift+click: toggle individual filter
      setActiveFilters((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
      });
    } else {
      // Click: select only this filter (or restore all if already solo)
      setActiveFilters((prev) => {
        if (prev.size === 1 && prev.has(key)) {
          return new Set(FILTER_KEYS);
        }
        return new Set([key]);
      });
    }
  };

  const filtered = events.filter((e) => {
    if (!activeFilters.has(e.typeDescKey)) return false;
    if (periodFilter !== null && e.periodDescriptor.number !== periodFilter) return false;
    return true;
  });

  const periods = [...new Set(events.map((e) => e.periodDescriptor.number))].sort();

  const playerName = (id?: number) => (id ? players[id] || `#${id}` : "");

  function eventDescription(e: PlayByPlayEvent): string {
    const d = e.details;
    if (!d) return e.typeDescKey;
    switch (e.typeDescKey) {
      case "goal":
        const scorer = playerName(d.scoringPlayerId);
        const a1 = playerName(d.assist1PlayerId);
        const a2 = playerName(d.assist2PlayerId);
        const assists = [a1, a2].filter(Boolean).join(", ");
        return `${scorer} scores${d.shotType ? ` (${d.shotType})` : ""}${assists ? ` \u2014 Assists: ${assists}` : " (unassisted)"}`;
      case "shot-on-goal":
        return `${playerName(d.shootingPlayerId)} shot${d.shotType ? ` (${d.shotType})` : ""} on ${playerName(d.goalieInNetId)}`;
      case "hit":
        return `${playerName(d.hittingPlayerId)} hits ${playerName(d.hitteePlayerId)}`;
      case "penalty":
        return `${playerName(d.committedByPlayerId)} \u2014 ${d.descKey || "penalty"}${d.duration ? ` (${d.duration} min)` : ""}`;
      case "takeaway":
        return `${playerName(d.eventOwnerTeamId ? undefined : undefined)} takeaway in ${d.zoneCode || "?"} zone`;
      case "giveaway":
        return `Giveaway in ${d.zoneCode || "?"} zone`;
      case "blocked-shot":
        return `Shot blocked${d.shootingPlayerId ? ` \u2014 ${playerName(d.shootingPlayerId)}` : ""}`;
      case "missed-shot":
        return `${playerName(d.shootingPlayerId)} missed shot${d.shotType ? ` (${d.shotType})` : ""}`;
      default:
        return e.typeDescKey.replace(/-/g, " ");
    }
  }

  const selectedGame = games.find((g) => g.id === selectedGameId);

  return (
    <div className="space-y-6">
      {!embedded && (
        <>
          {/* Game Selector */}
          <div className="bg-avs-dark rounded-xl p-6 card-glow">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span className="w-1 h-6 bg-avs-burgundy rounded-full" />
                Video Review
              </h2>
              <select
                value={selectedGameId || ""}
                onChange={(e) => { const id = Number(e.target.value); setSelectedGameId(id); onGameChange?.(id); }}
                className="bg-avs-darker text-white text-sm font-medium rounded-lg px-4 py-2 border border-white/10 focus:border-avs-burgundy focus:outline-none cursor-pointer min-w-[300px]"
              >
                {games.map((g) => {
                  const date = new Date(g.startTimeUTC).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });
                  const isHome = g.homeTeam.abbrev === "COL";
                  const opp = isHome ? g.awayTeam.abbrev : g.homeTeam.abbrev;
                  const prefix = isHome ? "vs" : "@";
                  const score = `${g.awayTeam.score}-${g.homeTeam.score}`;
                  return (
                    <option key={g.id} value={g.id}>
                      {date} {prefix} {opp} ({score})
                    </option>
                  );
                })}
              </select>
              {onNavigateToSummary && selectedGameId && (
                <button
                  onClick={() => onNavigateToSummary(selectedGameId)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-avs-darker text-avs-silver hover:bg-white/10 hover:text-white transition-all border border-white/10"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  Game Summary
                </button>
              )}
            </div>

            {/* Game Score Banner */}
            {selectedGame && teams && (
              <div className="mt-4 flex items-center justify-center gap-8 bg-avs-darker rounded-lg p-4">
                <div className="flex items-center gap-3">
                  {teams.away?.logo && <img src={teams.away.logo} alt="" className="w-10 h-10" />}
                  <span className="text-lg font-bold">{teams.away?.abbrev}</span>
                  <span className="text-3xl font-extrabold">{selectedGame.awayTeam.score}</span>
                </div>
                <div className="text-avs-silver text-sm">FINAL{selectedGame.gameOutcome?.lastPeriodType !== "REG" ? ` (${selectedGame.gameOutcome?.lastPeriodType})` : ""}</div>
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-extrabold">{selectedGame.homeTeam.score}</span>
                  <span className="text-lg font-bold">{teams.home?.abbrev}</span>
                  {teams.home?.logo && <img src={teams.home.logo} alt="" className="w-10 h-10" />}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-12 h-12 border-4 border-avs-burgundy border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Event Timeline - 2/3 */}
          <div className="lg:col-span-2 space-y-4">
            {/* Filters */}
            <div className="bg-avs-dark rounded-xl p-4 card-glow">
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-avs-silver text-xs uppercase tracking-wider mr-2">Event Filters:</span>
                {FILTER_KEYS.map((key) => {
                  const info = EVENT_TYPES[key];
                  const active = activeFilters.has(key);
                  return (
                    <button
                      key={key}
                      onClick={(e) => toggleFilter(key, e)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                        active
                          ? `${info.color} text-white shadow-md`
                          : "bg-avs-darker text-avs-silver hover:bg-white/10"
                      }`}
                    >
                      <span>{info.icon}</span>
                      {info.label}
                      <span className="ml-1 opacity-70">
                        {events.filter((e) => e.typeDescKey === key && (periodFilter === null || e.periodDescriptor.number === periodFilter)).length}
                      </span>
                    </button>
                  );
                })}
                <div className="ml-auto flex gap-1 bg-avs-darker rounded-lg p-1">
                  <button
                    onClick={() => setPeriodFilter(null)}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                      periodFilter === null ? "bg-avs-burgundy text-white" : "text-avs-silver hover:text-white"
                    }`}
                  >
                    All
                  </button>
                  {periods.map((p) => (
                    <button
                      key={p}
                      onClick={() => setPeriodFilter(p)}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                        periodFilter === p ? "bg-avs-burgundy text-white" : "text-avs-silver hover:text-white"
                      }`}
                    >
                      {p <= 3 ? `P${p}` : p === 4 ? "OT" : `${p - 3}OT`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Event List */}
            <div className="bg-avs-dark rounded-xl p-4 card-glow max-h-[600px] overflow-y-auto space-y-1.5">
              <h3 className="text-sm text-avs-silver uppercase tracking-wider mb-3">Event Timeline</h3>
              {filtered.length === 0 && (
                <p className="text-avs-silver text-sm text-center py-8">No events match the current filters.</p>
              )}
              {filtered.map((e) => {
                const info = EVENT_TYPES[e.typeDescKey] || { label: e.typeDescKey, color: "bg-gray-600", icon: "\u2022" };
                const isGoal = e.typeDescKey === "goal";
                const isSelected = selectedEvent?.eventId === e.eventId;
                const isColEvent = teams && e.details?.eventOwnerTeamId === teams.home?.id
                  ? teams.home?.abbrev === "COL"
                  : teams?.away?.abbrev === "COL";

                return (
                  <button
                    key={e.eventId}
                    data-event-id={e.eventId}
                    onClick={() => setSelectedEvent(isSelected ? null : e)}
                    className={`w-full text-left flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
                      isSelected
                        ? "bg-avs-burgundy/20 border border-avs-burgundy/50"
                        : isGoal
                        ? "bg-green-500/10 hover:bg-green-500/15 border border-transparent"
                        : "bg-avs-darker hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    {/* Period & Time */}
                    <div className="text-avs-silver text-xs w-16 shrink-0 text-center">
                      <div className="font-mono">{e.timeInPeriod}</div>
                      <div className="text-[10px]">
                        {e.periodDescriptor.number <= 3
                          ? `P${e.periodDescriptor.number}`
                          : e.periodDescriptor.number === 4
                          ? "OT"
                          : `${e.periodDescriptor.number - 3}OT`}
                      </div>
                    </div>

                    {/* Type Badge */}
                    <div className={`w-7 h-7 rounded-full ${info.color} flex items-center justify-center text-xs shrink-0`}>
                      {info.icon}
                    </div>

                    {/* Description */}
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm ${isGoal ? "font-bold text-green-400" : "font-medium"}`}>
                        {eventDescription(e)}
                      </div>
                      {isGoal && e.details?.awayScore != null && (
                        <div className="text-xs text-avs-silver mt-0.5">
                          Score: {teams?.away?.abbrev} {e.details.awayScore} - {teams?.home?.abbrev} {e.details.homeScore}
                        </div>
                      )}
                    </div>

                    {/* Comment count badge */}
                    {(commentCounts[e.eventId] || 0) > 0 && (
                      <div className="flex items-center gap-1 text-[10px] text-avs-silver bg-avs-darker px-1.5 py-0.5 rounded-full shrink-0">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                        </svg>
                        {commentCounts[e.eventId]}
                      </div>
                    )}

                    {/* Team indicator */}
                    <div className={`text-xs px-2 py-0.5 rounded-full ${isColEvent ? "bg-avs-burgundy/30 text-white" : "bg-white/10 text-avs-silver"}`}>
                      {isColEvent ? "COL" : teams?.away?.abbrev === "COL" ? teams?.home?.abbrev : teams?.away?.abbrev}
                    </div>

                    {/* Video link for goals */}
                    {isGoal && e.details?.highlightClipSharingUrl && (
                      <a
                        href={e.details.highlightClipSharingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(ev) => ev.stopPropagation()}
                        className="shrink-0 bg-avs-burgundy hover:bg-avs-burgundy/80 text-white text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1"
                      >
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                        </svg>
                        Watch
                      </a>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column - Ice Rink + Event Detail */}
          <div className="space-y-4">
            {/* Ice Rink */}
            <IceRink
              events={filtered}
              selectedEvent={selectedEvent}
              homeTeam={teams?.home}
              awayTeam={teams?.away}
            />

            {/* Coach Notes */}
            <CommentsPanel
              gameId={selectedGameId}
              selectedEventId={selectedEvent?.eventId ?? null}
              selectedEventType={selectedEvent?.typeDescKey ?? ""}
              selectedEventDesc={selectedEvent ? eventDescription(selectedEvent) : ""}
              onSelectEvent={(eventId) => {
                const evt = events.find((e) => e.eventId === eventId);
                if (evt) {
                  setSelectedEvent(evt);
                  const el = document.querySelector(`[data-event-id="${eventId}"]`);
                  el?.scrollIntoView({ behavior: "smooth", block: "center" });
                }
              }}
              onCommentsChange={setCommentCounts}
            />

            {/* Event Detail */}
            {selectedEvent && (
              <div className="bg-avs-dark rounded-xl p-5 card-glow">
                <h3 className="text-sm text-avs-silver uppercase tracking-wider mb-3">Event Detail</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-avs-silver">Type</span>
                    <span className="font-semibold capitalize">{selectedEvent.typeDescKey.replace(/-/g, " ")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-avs-silver">Period</span>
                    <span>
                      {selectedEvent.periodDescriptor.number <= 3
                        ? `Period ${selectedEvent.periodDescriptor.number}`
                        : "Overtime"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-avs-silver">Time</span>
                    <span className="font-mono">{selectedEvent.timeInPeriod}</span>
                  </div>
                  {selectedEvent.details?.zoneCode && (
                    <div className="flex justify-between">
                      <span className="text-avs-silver">Zone</span>
                      <span>
                        {selectedEvent.details.zoneCode === "O"
                          ? "Offensive"
                          : selectedEvent.details.zoneCode === "D"
                          ? "Defensive"
                          : "Neutral"}
                      </span>
                    </div>
                  )}
                  {selectedEvent.details?.shotType && (
                    <div className="flex justify-between">
                      <span className="text-avs-silver">Shot Type</span>
                      <span className="capitalize">{selectedEvent.details.shotType}</span>
                    </div>
                  )}
                  {selectedEvent.situationCode && (
                    <div className="flex justify-between">
                      <span className="text-avs-silver">Situation</span>
                      <span className="font-mono text-xs">{selectedEvent.situationCode}</span>
                    </div>
                  )}
                  {selectedEvent.details?.xCoord != null && (
                    <div className="flex justify-between">
                      <span className="text-avs-silver">Location</span>
                      <span className="font-mono text-xs">({selectedEvent.details.xCoord}, {selectedEvent.details.yCoord})</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Event Summary Stats */}
            <div className="bg-avs-dark rounded-xl p-5 card-glow">
              <h3 className="text-sm text-avs-silver uppercase tracking-wider mb-3">Game Summary</h3>
              <div className="grid grid-cols-2 gap-2">
                {FILTER_KEYS.map((key) => {
                  const info = EVENT_TYPES[key];
                  const count = events.filter((e) => e.typeDescKey === key).length;
                  return (
                    <div key={key} className="flex items-center gap-2 bg-avs-darker rounded-lg px-3 py-2">
                      <span className="text-sm">{info.icon}</span>
                      <span className="text-xs text-avs-silver flex-1">{info.label}</span>
                      <span className="text-sm font-bold">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
