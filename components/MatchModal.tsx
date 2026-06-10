"use client";

import { useEffect, useState } from "react";
import { MatchAnalysis, ValueBet } from "@/lib/types";

export interface MatchGroup {
  matchId: string;
  sport: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  kickoff: string;
  bets: ValueBet[];
}

function formatKickoff(iso: string): string {
  const d = new Date(iso);
  const diff = d.getTime() - Date.now();
  if (diff <= 0) return "Live now";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `${h > 0 ? `${h}h ` : ""}${m}m · ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

const SPORT_ICON: Record<string, string> = {
  Football: "⚽", Tennis: "🎾", Basketball: "🏀", Hockey: "🏒",
};

function riskColor(risk: string) {
  if (risk === "low")    return "text-emerald-400 bg-emerald-400/10 border-emerald-400/30";
  if (risk === "medium") return "text-yellow-400 bg-yellow-400/10 border-yellow-400/30";
  return "text-red-400 bg-red-400/10 border-red-400/30";
}

function confidenceBar(confidence: number) {
  const color =
    confidence >= 70 ? "bg-emerald-500" : confidence >= 55 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${confidence}%` }} />
      </div>
      <span className="text-sm font-bold text-white w-10 text-right">{confidence}%</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{title}</h3>
      {children}
    </div>
  );
}

export default function MatchModal({ group, onClose }: { group: MatchGroup; onClose: () => void }) {
  const [analysis, setAnalysis] = useState<MatchAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/analyze?id=${group.matchId}`)
      .then((r) => r.json())
      .then((data) => { setAnalysis(data); setLoading(false); })
      .catch(() => { setError("Analysis failed."); setLoading(false); });
  }, [group.matchId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-800 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
              <span>{SPORT_ICON[group.sport] ?? "🏅"}</span>
              <span>{group.league}</span>
              <span className="text-gray-600">·</span>
              <span>{formatKickoff(group.kickoff)}</span>
            </div>
            <h2 className="text-xl font-bold text-white">
              {group.homeTeam}
              <span className="text-gray-500 font-normal mx-3">vs</span>
              {group.awayTeam}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition text-lg"
          >✕</button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-6">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-400 text-sm">Analysing {group.homeTeam} vs {group.awayTeam}…</p>
              <p className="text-gray-600 text-xs">Checking {group.bets.length > 0 ? "odds, form & H2H" : "available data"}</p>
            </div>
          )}

          {error && (
            <div className="bg-red-900/30 border border-red-700 text-red-300 rounded-lg p-4">{error}</div>
          )}

          {analysis && !loading && (
            <>
              {/* ── RECOMMENDATION ── */}
              <Section title="Recommendation">
                <div className="bg-gray-800 rounded-xl p-5 flex flex-col gap-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      {analysis.recommendation === "no_bet" ? (
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">⛔</span>
                          <div>
                            <p className="text-lg font-bold text-gray-300">No Bet</p>
                            <p className="text-sm text-gray-500">No clear edge found</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-3xl">🎯</span>
                          <div>
                            <p className="text-xs text-gray-400 mb-0.5">Bet on</p>
                            <p className="text-xl font-bold text-emerald-400">{analysis.recommendationLabel}</p>
                            <p className="text-sm text-gray-400">
                              @ {analysis.bestBookmaker} · odds{" "}
                              <span className="text-white font-bold">{analysis.bestOdds}</span>
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="text-right flex flex-col gap-2">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${riskColor(analysis.riskLevel)}`}>
                        {analysis.riskLevel.toUpperCase()} RISK
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                      <span>Confidence</span>
                    </div>
                    {confidenceBar(analysis.confidence)}
                  </div>
                </div>
              </Section>

              {/* ── SCORE PREDICTION ── */}
              <Section title="Score Prediction">
                <div className="bg-gray-800 rounded-xl p-5">
                  <div className="flex items-center justify-center gap-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-400 mb-1">{group.homeTeam}</p>
                      <p className="text-5xl font-bold text-white">{analysis.scorePrediction.homeGoals}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl text-gray-600 font-bold">:</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-400 mb-1">{group.awayTeam}</p>
                      <p className="text-5xl font-bold text-white">{analysis.scorePrediction.awayGoals}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                      <span>Prediction confidence</span>
                    </div>
                    {confidenceBar(analysis.scorePrediction.confidence)}
                  </div>
                </div>
              </Section>

              {/* ── SUMMARY ── */}
              <Section title="Analysis Summary">
                <p className="text-gray-300 text-sm leading-relaxed bg-gray-800/50 rounded-xl p-4">
                  {analysis.summary}
                </p>
              </Section>

              {/* ── KEY FACTORS ── */}
              {analysis.keyFactors.length > 0 && (
                <Section title="Key Factors">
                  <ul className="flex flex-col gap-2">
                    {analysis.keyFactors.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                        <span className="text-emerald-500 mt-0.5 shrink-0">▸</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {/* ── FORM ANALYSIS ── */}
              <Section title="Team Form">
                <p className="text-gray-300 text-sm leading-relaxed">{analysis.formAnalysis}</p>
              </Section>

              {/* ── ODDS ANALYSIS ── */}
              <Section title="Odds & Market">
                <p className="text-gray-300 text-sm leading-relaxed">{analysis.oddsAnalysis}</p>

                {/* Odds comparison table */}
                {analysis.valueBets.length > 0 && (
                  <div className="mt-3 rounded-xl border border-gray-800 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-800/60">
                          <th className="text-left px-4 py-2 text-gray-400 font-medium">Bookmaker</th>
                          <th className="text-center px-3 py-2 text-gray-400 font-medium">{group.homeTeam}</th>
                          {analysis.valueBets.some((b) => b.outcome === "draw") && (
                            <th className="text-center px-3 py-2 text-gray-400 font-medium">Draw</th>
                          )}
                          <th className="text-center px-3 py-2 text-gray-400 font-medium">{group.awayTeam}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from(new Set(analysis.valueBets.map((b) => b.bookmaker))).map((bm) => {
                          const home = analysis.valueBets.find((b) => b.bookmaker === bm && b.outcome === "home");
                          const draw = analysis.valueBets.find((b) => b.bookmaker === bm && b.outcome === "draw");
                          const away = analysis.valueBets.find((b) => b.bookmaker === bm && b.outcome === "away");
                          return (
                            <tr key={bm} className="border-t border-gray-800 hover:bg-gray-800/40 transition">
                              <td className="px-4 py-2.5 text-white font-medium">{bm}</td>
                              {[home, draw, away].filter((_, i) => {
                                if (i === 1) return analysis.valueBets.some((b) => b.outcome === "draw");
                                return true;
                              }).map((cell, i) => (
                                <td key={i} className="text-center px-3 py-2.5">
                                  {cell ? (
                                    <span className="font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded text-xs">
                                      {cell.bookOdds} ✓
                                    </span>
                                  ) : <span className="text-gray-600">—</span>}
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </Section>

              {/* ── H2H ── */}
              <Section title="Head to Head">
                <p className="text-gray-300 text-sm leading-relaxed mb-3">{analysis.h2hAnalysis}</p>
              </Section>

              <p className="text-xs text-gray-600 text-center pb-2">
                Generated {new Date(analysis.generatedAt).toLocaleTimeString()} · For informational purposes only
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
