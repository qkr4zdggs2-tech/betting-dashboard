import { ValueBet } from "@/lib/types";

function formatCountdown(kickoff: string): string {
  const diff = new Date(kickoff).getTime() - Date.now();
  if (diff <= 0) return "Live";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function edgeColor(edge: number): string {
  if (edge >= 10) return "text-yellow-400 bg-yellow-400/10";
  if (edge >= 5)  return "text-coral-400 bg-coral-400/10";
  return "text-blue-400 bg-blue-400/10";
}

const SPORT_ICON: Record<string, string> = {
  Football: "⚽",
  Tennis: "🎾",
  Basketball: "🏀",
  Hockey: "🏒",
  MMA: "🥊",
};

export default function BetCard({
  bet,
  onClick,
}: {
  bet: ValueBet;
  onClick: () => void;
}) {
  const countdown = formatCountdown(bet.kickoff);
  const ec = edgeColor(bet.edge);

  return (
    <div
      onClick={onClick}
      className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col gap-4 hover:border-coral-600/50 hover:bg-gray-800/60 transition cursor-pointer group"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
            <span>{SPORT_ICON[bet.sport] ?? "🏅"}</span>
            <span>{bet.league}</span>
            <span>·</span>
            <span className={countdown === "Live" ? "text-red-400 font-medium" : ""}>
              {countdown}
            </span>
          </div>
          <p className="text-sm font-semibold text-white leading-snug group-hover:text-coral-400 transition">
            {bet.homeTeam} <span className="text-gray-500">vs</span> {bet.awayTeam}
          </p>
        </div>
        <span className={`shrink-0 text-sm font-bold px-2.5 py-1 rounded-lg ${ec}`}>
          +{bet.edge}%
        </span>
      </div>

      {/* Outcome */}
      <div className="bg-gray-800 rounded-lg px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 mb-0.5">Bet on</p>
          <p className="font-semibold text-white">{bet.outcomeLabel}</p>
          <p className="text-xs text-gray-400 mt-0.5">@ {bet.bookmaker}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-coral-400">{bet.bookOdds}</p>
          <p className="text-xs text-gray-500">Fair: {bet.trueOdds}</p>
        </div>
      </div>

      {/* Probability bar */}
      <div>
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Book implied: {bet.impliedProb}%</span>
          <span>True prob: {bet.trueProb}%</span>
        </div>
        <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full flex">
            <div className="bg-blue-500 h-full" style={{ width: `${bet.impliedProb}%` }} />
            <div
              className="bg-coral-500 h-full"
              style={{ width: `${Math.max(0, bet.trueProb - bet.impliedProb)}%` }}
            />
          </div>
        </div>
        <div className="flex justify-between mt-1.5 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-blue-500 rounded-full inline-block" />
            Implied
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-coral-500 rounded-full inline-block" />
            Edge
          </span>
          <span className="text-gray-600 group-hover:text-gray-400 transition">
            Click for details →
          </span>
        </div>
      </div>
    </div>
  );
}
