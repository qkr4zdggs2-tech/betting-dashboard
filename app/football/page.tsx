"use client";

import { useEffect, useState, useCallback } from "react";
import Header from "@/components/Header";

interface FootballMatch {
  id: string;
  home: string;
  away: string;
  group: string;
  venue: string;
  time: string;
  date: string;
  analysis: string;
  winner: string;
  winnerPct: number;
  drawPct: number;
  loser: string;
  loserPct: number;
  lineDirection: "over" | "under";
  lineValue: number;
  lineType: string;
  lineConfidence: "low" | "medium" | "medium-high" | "high";
  btts: boolean;
  isTopPick?: boolean;
  isUpsetAlert?: boolean;
  bestBets?: string[];
  odds?: { home: number; draw: number; away: number };
  result?: string;
  resultOutcome?: "win" | "loss" | "void";
}

interface LogEntry {
  date: string;
  match: string;
  pick: string;
  result: string;
  outcome: "win" | "loss" | "void" | "pending";
}

interface FootballData {
  date: string;
  generatedAt: string;
  tournament: string;
  matches: FootballMatch[];
  topPicks: string[];
  upsetAlerts: string[];
  log: LogEntry[];
}

const CONFIDENCE_COLOR: Record<string, string> = {
  high: "text-emerald-400",
  "medium-high": "text-emerald-300",
  medium: "text-yellow-400",
  low: "text-gray-500",
};

const OUTCOME_STYLE: Record<string, string> = {
  win: "text-emerald-400",
  loss: "text-red-400",
  void: "text-gray-400",
  pending: "text-yellow-400",
};

function PctBar({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-400 w-16 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-sm font-bold tabular-nums w-10 text-right ${color.replace("bg-", "text-")}`}>{pct}%</span>
    </div>
  );
}

function MatchCard({ m }: { m: FootballMatch }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      onClick={() => setExpanded(e => !e)}
      className={`bg-gray-900 border rounded-xl p-5 flex flex-col gap-4 cursor-pointer transition-all ${
        m.isTopPick ? "border-emerald-500/40 hover:border-emerald-500/70" :
        m.isUpsetAlert ? "border-orange-500/30 hover:border-orange-500/60" :
        "border-gray-800 hover:border-gray-700"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-green-900/40 text-green-400 border border-green-500/20">
              ⚽ Group {m.group}
            </span>
            <span className="text-xs text-gray-500 truncate">{m.venue}</span>
            <span className="text-xs text-gray-600">·</span>
            <span className="text-xs text-gray-400 font-medium">{m.time} CET</span>
            {m.isTopPick && (
              <span className="text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                🔑 Top Pick
              </span>
            )}
            {m.isUpsetAlert && (
              <span className="text-xs bg-orange-500/15 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-full font-semibold">
                ⚠️ Upset Alert
              </span>
            )}
          </div>
          <p className="text-lg font-bold text-white">
            {m.home} <span className="text-gray-500 font-normal text-sm">vs</span> {m.away}
          </p>
          {m.result && (
            <p className={`text-sm font-semibold mt-0.5 ${
              m.resultOutcome === "win" ? "text-emerald-400" :
              m.resultOutcome === "loss" ? "text-red-400" : "text-gray-400"
            }`}>{m.result}</p>
          )}
        </div>
        <span className="text-gray-600 text-xs mt-1 shrink-0">{expanded ? "▲" : "▼"}</span>
      </div>

      {/* Win % bars */}
      <div className="flex flex-col gap-1.5">
        <PctBar label={m.home} pct={m.winnerPct === m.loserPct ? m.winnerPct : m.winner === m.home ? m.winnerPct : m.loserPct} color={m.winner === m.home ? "bg-emerald-500" : "bg-gray-500"} />
        <PctBar label="Draw" pct={m.drawPct} color="bg-yellow-500" />
        <PctBar label={m.away} pct={m.winner === m.away ? m.winnerPct : m.loserPct} color={m.winner === m.away ? "bg-emerald-500" : "bg-gray-500"} />
      </div>

      {/* Pick chips */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="bg-gray-800 rounded-lg px-3 py-2 flex items-center gap-2">
          <span className="text-xs text-gray-400">Goals</span>
          <span className={`text-sm font-bold uppercase ${m.lineDirection === "over" ? "text-emerald-400" : "text-blue-400"}`}>
            {m.lineDirection}
          </span>
          <span className="text-sm font-bold text-white">{m.lineValue}</span>
          <span className={`text-xs font-medium ${CONFIDENCE_COLOR[m.lineConfidence] ?? "text-gray-500"}`}>
            ({m.lineConfidence})
          </span>
        </div>
        <div className="bg-gray-800 rounded-lg px-3 py-2 flex items-center gap-2">
          <span className="text-xs text-gray-400">BTTS</span>
          <span className={`text-xs font-semibold ${m.btts ? "text-emerald-400" : "text-red-400"}`}>
            {m.btts ? "✓ Yes" : "✗ No"}
          </span>
        </div>
        {m.odds && (
          <div className="bg-gray-800 rounded-lg px-3 py-2 flex items-center gap-3">
            <span className="text-xs text-gray-400">Odds</span>
            <span className="text-xs text-white font-mono">{m.home.slice(0,3).toUpperCase()} <span className="text-emerald-400 font-bold">{m.odds.home}</span></span>
            <span className="text-xs text-white font-mono">X <span className="text-yellow-400 font-bold">{m.odds.draw}</span></span>
            <span className="text-xs text-white font-mono">{m.away.slice(0,3).toUpperCase()} <span className="text-emerald-400 font-bold">{m.odds.away}</span></span>
          </div>
        )}
      </div>

      {/* Analysis */}
      {expanded && (
        <div className="border-t border-gray-800 pt-3 flex flex-col gap-3">
          <p className="text-sm text-gray-300 leading-relaxed">{m.analysis}</p>
          {m.bestBets && m.bestBets.length > 0 && (
            <div>
              <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1.5">💰 Best Bets</p>
              <ul className="flex flex-col gap-1">
                {m.bestBets.map((bet, i) => (
                  <li key={i} className="text-xs text-emerald-200/80 flex gap-1.5">
                    <span className="text-emerald-500 shrink-0">▸</span>
                    <span>{bet}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-gray-700 hover:text-gray-500 transition">
        {expanded ? "Click to collapse" : "Click for analysis →"}
      </p>
    </div>
  );
}

function LogRow({ entry }: { entry: LogEntry }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-gray-800/50 last:border-0">
      <span className="text-xs text-gray-500 w-16 shrink-0">{entry.date}</span>
      <span className="text-xs text-gray-300 flex-1 min-w-0 truncate">{entry.match}</span>
      <span className="text-xs text-gray-400 w-28 shrink-0 truncate">{entry.pick}</span>
      <span className="text-xs text-gray-400 w-20 shrink-0 truncate">{entry.result}</span>
      <span className={`text-xs font-bold w-14 shrink-0 text-right ${OUTCOME_STYLE[entry.outcome]}`}>
        {entry.outcome.toUpperCase()}
      </span>
    </div>
  );
}

export default function FootballPage() {
  const [data, setData] = useState<FootballData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "top" | "upset">("all");
  const [activeTab, setActiveTab] = useState<"picks" | "log">("picks");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/football");
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const matches = data?.matches ?? [];
  const filtered =
    filter === "top" ? matches.filter(m => m.isTopPick) :
    filter === "upset" ? matches.filter(m => m.isUpsetAlert) :
    matches;

  const log = data?.log ?? [];
  const wins = log.filter(e => e.outcome === "win").length;
  const losses = log.filter(e => e.outcome === "loss").length;
  const total = wins + losses;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-8">

        {/* Title */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              ⚽ {data?.tournament ?? "Football Analysis"}
            </h1>
            {data?.generatedAt && (
              <p className="text-sm text-gray-400 mt-1">
                Updated {new Date(data.generatedAt).toLocaleString("cs-CZ", { timeZone: "Europe/Prague" })}
              </p>
            )}
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            {loading ? "Loading…" : "⟳ Refresh"}
          </button>
        </div>

        {/* Stats strip */}
        {matches.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Matches</p>
              <p className="text-2xl font-bold text-white">{matches.length}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Top Picks</p>
              <p className="text-2xl font-bold text-emerald-400">{matches.filter(m => m.isTopPick).length}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Upset Alerts</p>
              <p className="text-2xl font-bold text-orange-400">{matches.filter(m => m.isUpsetAlert).length}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Record</p>
              <p className="text-2xl font-bold text-blue-400">{total > 0 ? `${wins}W/${losses}L` : "—"}</p>
            </div>
          </div>
        )}

        {/* Top picks banner */}
        {(data?.topPicks?.length ?? 0) > 0 && (
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 mb-5">
            <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">🔑 Top Picks</p>
            <div className="flex flex-col gap-1.5">
              {data!.topPicks.map((tip, i) => (
                <p key={i} className="text-xs text-emerald-200/80">{tip}</p>
              ))}
            </div>
          </div>
        )}

        {/* Upset alerts banner */}
        {(data?.upsetAlerts?.length ?? 0) > 0 && (
          <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-4 mb-5">
            <p className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-2">⚠️ Upset Alerts</p>
            <div className="flex flex-col gap-1.5">
              {data!.upsetAlerts.map((alert, i) => (
                <p key={i} className="text-xs text-orange-200/80">{alert}</p>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button onClick={() => setActiveTab("picks")} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === "picks" ? "bg-green-700 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
            Match Picks
          </button>
          <button onClick={() => setActiveTab("log")} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === "log" ? "bg-green-700 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
            Results Log {total > 0 && `(${total})`}
          </button>
        </div>

        {activeTab === "picks" && (
          <>
            <div className="flex gap-2 mb-4">
              {(["all", "top", "upset"] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${filter === f ? "bg-green-700 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
                  {f === "all" ? "All Matches" : f === "top" ? "🔑 Top Picks" : "⚠️ Upset Alerts"}
                </button>
              ))}
            </div>

            {loading && !data && (
              <div className="flex items-center justify-center py-24">
                <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              {filtered.map(m => <MatchCard key={m.id} m={m} />)}
              {filtered.length === 0 && (
                <p className="text-gray-500 text-sm col-span-2 text-center py-12">No matches in this filter.</p>
              )}
            </div>
          </>
        )}

        {activeTab === "log" && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            {log.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-12">No results logged yet.</p>
            ) : (
              <>
                <div className="flex items-center gap-3 pb-2 border-b border-gray-700 mb-1">
                  <span className="text-xs text-gray-600 w-16">Date</span>
                  <span className="text-xs text-gray-600 flex-1">Match</span>
                  <span className="text-xs text-gray-600 w-28">Pick</span>
                  <span className="text-xs text-gray-600 w-20">Result</span>
                  <span className="text-xs text-gray-600 w-14 text-right">Outcome</span>
                </div>
                {log.map((entry, i) => <LogRow key={i} entry={entry} />)}
                <div className="mt-4 pt-4 border-t border-gray-800 flex items-center gap-6 text-sm">
                  <span className="text-gray-400">Total: <span className="text-white font-bold">{total}</span></span>
                  <span className="text-emerald-400">Wins: <span className="font-bold">{wins}</span></span>
                  <span className="text-red-400">Losses: <span className="font-bold">{losses}</span></span>
                  {total > 0 && <span className="text-yellow-400">Hit rate: <span className="font-bold">{Math.round(wins/total*100)}%</span></span>}
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
