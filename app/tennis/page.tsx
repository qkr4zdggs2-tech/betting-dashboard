"use client";

import { useEffect, useState, useCallback } from "react";
import Header from "@/components/Header";
import LiveScores from "@/components/LiveScores";

// ── Types ──────────────────────────────────────────────────────────────────────

interface TennisMatchPick {
  id: string;
  player1: string;
  player2: string;
  tournament: string;
  surface: "grass" | "clay" | "hard";
  time: string; // e.g. "11:00"
  analysis: string;
  winner: string;
  winnerPct: number;
  loser: string;
  loserPct: number;
  lineDirection: "over" | "under";
  lineValue: number;
  lineType: "games" | "sets";
  lineConfidence: "low" | "medium" | "medium-high" | "high";
  bagel: "no bagel" | "bagel risk" | "avoid no-bagel";
  acesLine?: string;
  acesConfidence?: string;
  isTopPick?: boolean;
  isUpsetAlert?: boolean;
}

interface LogEntry {
  date: string;
  match: string;
  pick: string;
  result: string;
  outcome: "win" | "loss" | "void" | "pending";
}

interface TennisData {
  date: string;
  generatedAt: string;
  tournaments: string[];
  matches: TennisMatchPick[];
  topPicks: string[];
  upsetAlerts: string[];
  acesWatch?: string[];
  log: LogEntry[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const SURFACE_COLOR: Record<string, string> = {
  grass: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  clay: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  hard: "text-blue-400 bg-blue-500/10 border-blue-500/20",
};

const SURFACE_DOT: Record<string, string> = {
  grass: "bg-emerald-400",
  clay: "bg-orange-400",
  hard: "bg-blue-400",
};

const CONFIDENCE_COLOR: Record<string, string> = {
  high: "text-emerald-400",
  "medium-high": "text-emerald-300",
  medium: "text-yellow-400",
  low: "text-gray-500",
};

const BAGEL_COLOR: Record<string, string> = {
  "no bagel": "text-emerald-400",
  "bagel risk": "text-orange-400",
  "avoid no-bagel": "text-red-400",
};

const OUTCOME_STYLE: Record<string, string> = {
  win: "text-emerald-400",
  loss: "text-red-400",
  void: "text-gray-400",
  pending: "text-yellow-400",
};

function WinnerBar({ pct, name }: { pct: number; name: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-400 w-20 truncate">{name}</span>
      <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            pct >= 75 ? "bg-emerald-500" : pct >= 60 ? "bg-yellow-500" : "bg-orange-500"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span
        className={`text-sm font-bold tabular-nums ${
          pct >= 75 ? "text-emerald-400" : pct >= 60 ? "text-yellow-400" : "text-orange-400"
        }`}
      >
        {pct}%
      </span>
    </div>
  );
}

function MatchCard({ m }: { m: TennisMatchPick }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      className={`bg-gray-900 border rounded-xl p-5 flex flex-col gap-4 cursor-pointer transition-all ${
        m.isTopPick
          ? "border-emerald-500/40 hover:border-emerald-500/70"
          : m.isUpsetAlert
          ? "border-orange-500/30 hover:border-orange-500/60"
          : "border-gray-800 hover:border-gray-700"
      }`}
      onClick={() => setExpanded((e) => !e)}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {/* Surface badge */}
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded border ${
                SURFACE_COLOR[m.surface] ?? "text-gray-400 bg-gray-800 border-gray-700"
              }`}
            >
              <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${SURFACE_DOT[m.surface]}`} />
              {m.surface}
            </span>
            <span className="text-xs text-gray-500">{m.tournament}</span>
            <span className="text-xs text-gray-600">·</span>
            <span className="text-xs text-gray-400 font-medium">{m.time}</span>
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
          <p className="text-base font-bold text-white leading-snug">
            {m.player1}{" "}
            <span className="text-gray-500 font-normal text-sm">vs</span>{" "}
            {m.player2}
          </p>
        </div>
        <span className="text-gray-600 text-xs mt-1 shrink-0">{expanded ? "▲" : "▼"}</span>
      </div>

      {/* Win probability bars */}
      <div className="flex flex-col gap-1.5">
        <WinnerBar pct={m.winnerPct} name={m.winner} />
        <WinnerBar pct={m.loserPct} name={m.loser} />
      </div>

      {/* Pick row */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Line */}
        <div className="bg-gray-800 rounded-lg px-3 py-2 flex items-center gap-2">
          <span className="text-xs text-gray-400">Line</span>
          <span className={`text-sm font-bold uppercase ${m.lineDirection === "over" ? "text-emerald-400" : "text-blue-400"}`}>
            {m.lineDirection}
          </span>
          <span className="text-sm font-bold text-white">{m.lineValue} {m.lineType}</span>
          <span className={`text-xs font-medium ${CONFIDENCE_COLOR[m.lineConfidence] ?? "text-gray-500"}`}>
            ({m.lineConfidence})
          </span>
        </div>
        {/* Bagel */}
        <div className="bg-gray-800 rounded-lg px-3 py-2 flex items-center gap-2">
          <span className="text-xs text-gray-400">Bagel</span>
          <span className={`text-xs font-semibold ${BAGEL_COLOR[m.bagel] ?? "text-gray-400"}`}>
            {m.bagel === "no bagel" ? "✓ No bagel" : m.bagel === "bagel risk" ? "⚠ Risk" : "✗ Avoid no-bagel"}
          </span>
        </div>
      </div>

      {/* Aces line — shown only if present */}
      {m.acesLine && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2 flex items-center gap-2">
          <span className="text-yellow-400 text-sm">🎾</span>
          <span className="text-xs text-yellow-400 font-semibold">ACES:</span>
          <span className="text-xs text-yellow-300 font-medium">{m.acesLine}</span>
        </div>
      )}

      {/* Expanded analysis */}
      {expanded && (
        <div className="border-t border-gray-800 pt-3">
          <p className="text-sm text-gray-300 leading-relaxed">{m.analysis}</p>
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
      <span className="text-xs text-gray-500 w-20 shrink-0">{entry.date}</span>
      <span className="text-xs text-gray-300 flex-1 min-w-0 truncate">{entry.match}</span>
      <span className="text-xs text-gray-400 w-28 shrink-0 truncate">{entry.pick}</span>
      <span className="text-xs text-gray-400 w-20 shrink-0 truncate">{entry.result}</span>
      <span className={`text-xs font-bold w-14 shrink-0 text-right ${OUTCOME_STYLE[entry.outcome]}`}>
        {entry.outcome.toUpperCase()}
      </span>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function TennisPage() {
  const [data, setData] = useState<TennisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "top" | "upset">("all");
  const [activeTab, setActiveTab] = useState<"picks" | "scores" | "log">("picks");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/tennis");
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const matches = data?.matches ?? [];
  const filtered =
    filter === "top"
      ? matches.filter((m) => m.isTopPick)
      : filter === "upset"
      ? matches.filter((m) => m.isUpsetAlert)
      : matches;

  const wins = (data?.log ?? []).filter((e) => e.outcome === "win").length;
  const losses = (data?.log ?? []).filter((e) => e.outcome === "loss").length;
  const total = wins + losses;

  const isEmpty = !data?.date;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-8">

        {/* Page title */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              🎾 Tennis Analysis
            </h1>
            {data?.generatedAt && (
              <p className="text-sm text-gray-400 mt-1">
                Updated {new Date(data.generatedAt).toLocaleString("cs-CZ", { timeZone: "Europe/Prague" })}
                {data.tournaments?.length > 0 && ` · ${data.tournaments.join(", ")}`}
              </p>
            )}
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            {loading ? "Loading…" : "⟳ Refresh"}
          </button>
        </div>

        {/* Stats strip */}
        {!isEmpty && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Today's Matches</p>
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
              <p className="text-2xl font-bold text-blue-400">
                {total > 0 ? `${wins}W/${losses}L` : "—"}
              </p>
            </div>
          </div>
        )}

        {/* Aces Watch strip */}
        {!isEmpty && data?.acesWatch && data.acesWatch.length > 0 && (
          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4 mb-5">
            <p className="text-xs font-bold text-yellow-400 uppercase tracking-wider mb-2">🎾 Aces Watch</p>
            <div className="flex flex-col gap-1.5">
              {data.acesWatch.map((tip, i) => (
                <p key={i} className="text-xs text-yellow-200/80">{tip}</p>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab("picks")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === "picks" ? "bg-emerald-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}
          >
            Today's Picks
          </button>
          <button
            onClick={() => setActiveTab("scores")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${activeTab === "scores" ? "bg-emerald-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            Live Scores
          </button>
          <button
            onClick={() => setActiveTab("log")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === "log" ? "bg-emerald-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}
          >
            Results Log {total > 0 && `(${total})`}
          </button>
        </div>

        {/* PICKS TAB */}
        {activeTab === "picks" && (
          <>
            {/* Filter buttons */}
            {!isEmpty && (
              <div className="flex gap-2 mb-4">
                {(["all", "top", "upset"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${filter === f ? "bg-emerald-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}
                  >
                    {f === "all" ? "All Matches" : f === "top" ? "🔑 Top Picks" : "⚠️ Upset Alerts"}
                  </button>
                ))}
              </div>
            )}

            {/* Loading */}
            {loading && !data && (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-400">Loading analysis…</p>
              </div>
            )}

            {/* Empty state */}
            {!loading && isEmpty && (
              <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
                <span className="text-5xl">🎾</span>
                <p className="text-gray-300 font-semibold text-lg">No analysis yet</p>
                <p className="text-gray-500 text-sm max-w-sm">
                  The daily routine runs every morning at 8am and posts picks here automatically.
                  You can also paste analysis data via the API.
                </p>
              </div>
            )}

            {/* Match grid */}
            {!isEmpty && (
              <div className="grid gap-4 sm:grid-cols-2">
                {filtered.map((m) => (
                  <MatchCard key={m.id} m={m} />
                ))}
                {filtered.length === 0 && (
                  <p className="text-gray-500 text-sm col-span-2 text-center py-12">No matches in this filter.</p>
                )}
              </div>
            )}
          </>
        )}

        {/* LIVE SCORES TAB */}
        {activeTab === "scores" && (
          <LiveScores />
        )}

        {/* LOG TAB */}
        {activeTab === "log" && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            {(data?.log ?? []).length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-12">No results logged yet. Send match outcomes to start the record.</p>
            ) : (
              <>
                {/* Log header */}
                <div className="flex items-center gap-3 pb-2 border-b border-gray-700 mb-1">
                  <span className="text-xs text-gray-600 w-20">Date</span>
                  <span className="text-xs text-gray-600 flex-1">Match</span>
                  <span className="text-xs text-gray-600 w-28">Pick</span>
                  <span className="text-xs text-gray-600 w-20">Result</span>
                  <span className="text-xs text-gray-600 w-14 text-right">Outcome</span>
                </div>
                {(data?.log ?? []).map((entry, i) => (
                  <LogRow key={i} entry={entry} />
                ))}
                {/* Summary */}
                <div className="mt-4 pt-4 border-t border-gray-800 flex items-center gap-6 text-sm">
                  <span className="text-gray-400">Total: <span className="text-white font-bold">{total}</span></span>
                  <span className="text-emerald-400">Wins: <span className="font-bold">{wins}</span></span>
                  <span className="text-red-400">Losses: <span className="font-bold">{losses}</span></span>
                  {total > 0 && (
                    <span className="text-yellow-400">
                      Hit rate: <span className="font-bold">{Math.round((wins / total) * 100)}%</span>
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
