"use client";

import { useEffect, useState } from "react";
import { MatchAnalysis } from "@/lib/types";
import { MatchGroup } from "@/components/MatchModal";

const SPORT_ICON: Record<string, string> = {
  Football: "⚽", Tennis: "🎾", Basketball: "🏀", Hockey: "🏒",
};

function formatCountdown(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return "Live";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function confidenceColor(c: number) {
  if (c >= 70) return "text-coral-400";
  if (c >= 55) return "text-yellow-400";
  return "text-orange-400";
}

function riskBadge(risk: string) {
  if (risk === "low")    return "bg-coral-500/10 text-coral-400 border-coral-500/20";
  if (risk === "medium") return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
  return "bg-orange-500/10 text-orange-400 border-orange-500/20";
}

export default function MatchCard({
  group,
  onClick,
}: {
  group: MatchGroup;
  onClick: () => void;
}) {
  const [analysis, setAnalysis] = useState<MatchAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const countdown = formatCountdown(group.kickoff);

  useEffect(() => {
    fetch(`/api/analyze?id=${group.matchId}`)
      .then((r) => r.json())
      .then((data) => { setAnalysis(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [group.matchId]);

  return (
    <div
      onClick={onClick}
      className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col gap-4 hover:border-coral-600/40 hover:bg-gray-800/50 transition cursor-pointer group"
    >
      {/* Match header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
            <span>{SPORT_ICON[group.sport] ?? "🏅"}</span>
            <span>{group.league}</span>
            <span>·</span>
            <span className={countdown === "Live" ? "text-red-400 font-medium" : ""}>{countdown}</span>
          </div>
          <p className="text-sm font-semibold text-white leading-snug group-hover:text-coral-400 transition">
            {group.homeTeam} <span className="text-gray-500 font-normal">vs</span> {group.awayTeam}
          </p>
        </div>
        {analysis && analysis.recommendation !== "no_bet" && (
          <span className={`shrink-0 text-xs font-semibold px-2 py-1 rounded-md border ${riskBadge(analysis.riskLevel)}`}>
            {analysis.riskLevel.toUpperCase()}
          </span>
        )}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="flex flex-col gap-2 animate-pulse">
          <div className="h-10 bg-gray-800 rounded-lg" />
          <div className="h-6 bg-gray-800 rounded-lg w-3/4" />
          <div className="h-4 bg-gray-800 rounded w-1/2" />
        </div>
      )}

      {/* No analysis */}
      {!loading && !analysis && (
        <p className="text-xs text-gray-500">Analysis unavailable</p>
      )}

      {/* Analysis result */}
      {!loading && analysis && (
        <>
          {/* Best bet */}
          <div className="bg-gray-800 rounded-lg px-4 py-3 flex items-center justify-between gap-3">
            {analysis.recommendation === "no_bet" ? (
              <div className="flex items-center gap-2">
                <span className="text-lg">⛔</span>
                <div>
                  <p className="text-xs text-gray-400">Best bet</p>
                  <p className="text-sm font-semibold text-gray-400">Skip this match</p>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Best bet</p>
                  <p className="text-base font-bold text-white">{analysis.recommendationLabel}</p>
                  <p className="text-xs text-gray-400 mt-0.5">@ {analysis.bestBookmaker}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-2xl font-bold text-coral-400">{analysis.bestOdds}</p>
                  <p className={`text-xs font-semibold ${confidenceColor(analysis.confidence)}`}>
                    {analysis.confidence}% conf
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Score prediction */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">Predicted score</span>
              <span className="text-sm font-bold text-white tabular-nums">
                {analysis.scorePrediction.homeGoals} – {analysis.scorePrediction.awayGoals}
              </span>
            </div>
            {/* Confidence mini-bar */}
            <div className="flex items-center gap-2 w-28">
              <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${analysis.recommendation === "no_bet" ? "bg-gray-600" : analysis.confidence >= 70 ? "bg-coral-500" : analysis.confidence >= 55 ? "bg-yellow-500" : "bg-orange-500"}`}
                  style={{ width: `${analysis.confidence}%` }}
                />
              </div>
            </div>
          </div>

          {/* Value edge badge (small, secondary info) */}
          {analysis.valueBets.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {analysis.valueBets.slice(0, 3).map((vb, i) => (
                <span key={i} className="text-xs bg-blue-900/30 text-blue-400 border border-blue-800/40 px-2 py-0.5 rounded-full">
                  +{vb.edge}% edge @ {vb.bookmaker}
                </span>
              ))}
            </div>
          )}

          <p className="text-xs text-gray-600 group-hover:text-gray-500 transition">
            Click for full analysis →
          </p>
        </>
      )}
    </div>
  );
}
