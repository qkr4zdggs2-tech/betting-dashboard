import { ValueBet } from "@/lib/types";

interface MatchSummary {
  id: string;
  sport: string;
  hasForm: boolean;
  hasH2H: boolean;
  bookmakerCount: number;
}

export default function StatsBar({
  bets,
  matches,
}: {
  bets: ValueBet[];
  matches: MatchSummary[];
}) {
  const avgEdge =
    bets.length > 0
      ? (bets.reduce((a, b) => a + b.edge, 0) / bets.length).toFixed(1)
      : "0.0";

  const topEdge =
    bets.length > 0
      ? Math.max(...bets.map((b) => b.edge)).toFixed(1)
      : "0.0";

  const withFullData = matches.filter((m) => m.hasForm && m.hasH2H).length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Matches</p>
        <p className="text-2xl font-bold text-white">{matches.length}</p>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Value Bets</p>
        <p className="text-2xl font-bold text-emerald-400">{bets.length}</p>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Best Edge</p>
        <p className="text-2xl font-bold text-yellow-400">+{topEdge}%</p>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Full Analysis</p>
        <p className="text-2xl font-bold text-blue-400">{withFullData}/{matches.length}</p>
      </div>
    </div>
  );
}
