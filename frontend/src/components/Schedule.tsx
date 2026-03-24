import type { Game } from "../types";

interface Props {
  upcoming: Game[];
  recent: Game[];
}

export default function Schedule({ upcoming, recent }: Props) {
  return (
    <div className="bg-avs-dark rounded-xl p-6 card-glow">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <span className="w-1 h-6 bg-avs-burgundy rounded-full" />
        Schedule
      </h2>

      {/* Recent Results */}
      {recent.length > 0 && (
        <>
          <h3 className="text-sm text-avs-silver uppercase tracking-wider mb-2">
            Recent Results
          </h3>
          <div className="space-y-2 mb-5">
            {recent.map((g) => (
              <GameRow key={g.id} game={g} isResult />
            ))}
          </div>
        </>
      )}

      {/* Upcoming */}
      <h3 className="text-sm text-avs-silver uppercase tracking-wider mb-2">
        Upcoming Games
      </h3>
      <div className="space-y-2">
        {upcoming.length === 0 ? (
          <p className="text-avs-silver text-sm">No upcoming games scheduled.</p>
        ) : (
          upcoming.map((g) => <GameRow key={g.id} game={g} />)
        )}
      </div>
    </div>
  );
}

function GameRow({ game, isResult }: { game: Game; isResult?: boolean }) {
  const date = new Date(game.startTimeUTC);
  const dateStr = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  const isHome = game.homeTeam.abbrev === "COL";
  const opponent = isHome ? game.awayTeam : game.homeTeam;
  const prefix = isHome ? "vs" : "@";

  let resultText = "";
  if (isResult && game.awayTeam.score != null && game.homeTeam.score != null) {
    const colScore = isHome ? game.homeTeam.score : game.awayTeam.score;
    const oppScore = isHome ? game.awayTeam.score : game.homeTeam.score;
    const won = colScore > oppScore;
    const otTag = game.gameOutcome?.lastPeriodType !== "REG"
      ? ` (${game.gameOutcome?.lastPeriodType})`
      : "";
    resultText = `${won ? "W" : "L"} ${colScore}-${oppScore}${otTag}`;
  }

  return (
    <div className="flex items-center gap-3 bg-avs-darker rounded-lg px-4 py-2 hover:bg-white/5 transition-colors">
      <img src={opponent.logo} alt={opponent.abbrev} className="w-8 h-8" />
      <div className="flex-1">
        <span className="text-avs-silver text-xs mr-2">{prefix}</span>
        <span className="font-medium">{opponent.abbrev}</span>
      </div>
      <div className="text-right text-sm">
        {isResult ? (
          <div>
            <div className="text-avs-silver text-xs">{dateStr}</div>
            <span
              className={`font-semibold ${
                resultText.startsWith("W") ? "text-green-400" : "text-red-400"
              }`}
            >
              {resultText}
            </span>
          </div>
        ) : (
          <>
            <div className="text-avs-silver text-xs">{dateStr}</div>
            <div>{timeStr}</div>
          </>
        )}
      </div>
    </div>
  );
}
