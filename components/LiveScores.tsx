"use client";

import { useEffect, useState, useCallback } from "react";

interface LiveMatch {
  id: string;
  tournament: string;
  tour: "ATP" | "WTA";
  player1: string;
  player1Short: string;
  player2: string;
  player2Short: string;
  setsWon1: number;
  setsWon2: number;
  sets1: number[];
  sets2: number[];
  tiebreaks: (number | null)[];
  state: "pre" | "in" | "post";
  statusText: string;
  rawStatus: string;
  winner: string | null;
  startTime: string;
}

interface PickMatch {
  player1: string;
  player2: string;
  winner: string;
  winnerPct: number;
  loser: string;
  loserPct: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatTime(iso: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleTimeString("cs-CZ", {
      hour: "2-digit", minute: "2-digit", timeZone: "Europe/Prague",
    });
  } catch { return ""; }
}

function formatDate(iso: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("cs-CZ", {
      day: "numeric", month: "numeric", timeZone: "Europe/Prague",
    });
  } catch { return ""; }
}

// ── Win % bar ──────────────────────────────────────────────────────────────────

function WinPctBar({ pct, isWinner }: { pct: number; isWinner: boolean }) {
  if (!pct) return null;
  return (
    <div className="flex items-center gap-1 mt-0.5">
      <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${pct >= 75 ? "bg-emerald-500" : pct >= 60 ? "bg-yellow-500" : "bg-orange-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-xs font-bold tabular-nums ${
        isWinner
          ? pct >= 75 ? "text-emerald-400" : pct >= 60 ? "text-yellow-400" : "text-orange-400"
          : "text-gray-500"
      }`}>{pct}%</span>
    </div>
  );
}

// ── Score display ──────────────────────────────────────────────────────────────

function ScoreGrid({ m, pick }: { m: LiveMatch; pick?: PickMatch }) {
  const { sets1, sets2, setsWon1, setsWon2, state, winner, player1, player2 } = m;
  const numSets = Math.max(sets1.length, sets2.length);

  if (numSets === 0 && state !== "in") return null;

  const p1Wins = winner === player1;
  const p2Wins = winner === player2;

  // Find win % for each player from picks
  const p1Pct = pick
    ? pick.player1.toLowerCase().includes(player1.split(" ").pop()?.toLowerCase() ?? "") ||
      player1.toLowerCase().includes(pick.player1.split(" ").pop()?.toLowerCase() ?? "")
      ? pick.winnerPct
      : pick.loserPct
    : null;
  const p2Pct = p1Pct != null ? 100 - p1Pct : null;

  return (
    <div className="font-mono text-sm">
      {/* Set headers */}
      <div className="flex gap-1 mb-1">
        <div className="w-32" /> {/* player name space */}
        {Array.from({ length: numSets }).map((_, i) => (
          <div key={i} className="w-8 text-center text-xs text-gray-600">S{i + 1}</div>
        ))}
        {numSets > 0 && <div className="w-8 text-center text-xs text-gray-600">Sets</div>}
      </div>

      {/* Player 1 row */}
      <div className="flex items-center gap-1 mb-2">
        <div className="w-32 min-w-0">
          <div className={`text-xs truncate font-medium ${state === "post" && p1Wins ? "text-white" : "text-gray-300"}`}>
            {m.player1}
            {state === "post" && p1Wins && <span className="text-emerald-400 ml-1">✓</span>}
          </div>
          {p1Pct != null && <WinPctBar pct={p1Pct} isWinner={p1Wins || state !== "post"} />}
        </div>
        {sets1.map((s, i) => {
          const opp = sets2[i] ?? 0;
          const won = s > opp || (s === 7 && opp === 6);
          return (
            <div key={i} className={`w-8 text-center text-sm rounded ${
              state === "post"
                ? won ? "text-white font-bold" : "text-gray-500"
                : "text-gray-200"
            }`}>
              {s}
            </div>
          );
        })}
        {numSets > 0 && (
          <div className={`w-8 text-center text-sm font-bold ${
            state === "post" && p1Wins ? "text-emerald-400" :
            state === "in" ? "text-yellow-400" : "text-gray-400"
          }`}>
            {setsWon1}
          </div>
        )}
      </div>

      {/* Player 2 row */}
      <div className="flex items-center gap-1">
        <div className="w-32 min-w-0">
          <div className={`text-xs truncate font-medium ${state === "post" && p2Wins ? "text-white" : "text-gray-300"}`}>
            {m.player2}
            {state === "post" && p2Wins && <span className="text-emerald-400 ml-1">✓</span>}
          </div>
          {p2Pct != null && <WinPctBar pct={p2Pct} isWinner={p2Wins || state !== "post"} />}
        </div>
        {sets2.map((s, i) => {
          const opp = sets1[i] ?? 0;
          const won = s > opp || (s === 7 && opp === 6);
          return (
            <div key={i} className={`w-8 text-center text-sm rounded ${
              state === "post"
                ? won ? "text-white font-bold" : "text-gray-500"
                : "text-gray-200"
            }`}>
              {s}
            </div>
          );
        })}
        {numSets > 0 && (
          <div className={`w-8 text-center text-sm font-bold ${
            state === "post" && p2Wins ? "text-emerald-400" :
            state === "in" ? "text-yellow-400" : "text-gray-400"
          }`}>
            {setsWon2}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Match card ─────────────────────────────────────────────────────────────────

function LiveMatchCard({ m, pick }: { m: LiveMatch; pick?: PickMatch }) {
  const isLive = m.state === "in";
  const isDone = m.state === "post";
  const isPre = m.state === "pre";

  return (
    <div className={`bg-gray-900 border rounded-xl p-4 flex flex-col gap-3 ${
      isLive ? "border-red-500/40 shadow-sm shadow-red-900/20" :
      isDone ? "border-gray-800 opacity-80" :
      "border-gray-800"
    }`}>

      {/* Top row: tournament + status */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
            m.tour === "ATP" ? "bg-blue-900/40 text-blue-400" : "bg-pink-900/40 text-pink-400"
          }`}>{m.tour}</span>
          <span className="text-xs text-gray-500 truncate">{m.tournament}</span>
        </div>

        {/* Status badge */}
        {isLive && (
          <span className="flex items-center gap-1 text-xs font-bold text-red-400 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            {m.rawStatus !== "in" ? m.rawStatus : "LIVE"}
          </span>
        )}
        {isDone && (
          <span className="text-xs text-gray-600 shrink-0">
            {m.statusText === "Final" ? "FT" : m.statusText}
          </span>
        )}
        {isPre && (
          <span className="text-xs text-gray-500 shrink-0 font-medium">
            {formatTime(m.startTime)}
          </span>
        )}
      </div>

      {/* Score grid — only shown if there are sets */}
      {(m.sets1.length > 0 || m.sets2.length > 0) ? (
        <ScoreGrid m={m} pick={pick} />
      ) : (
        /* Pre-match: show full names + win % if available */
        <div className="flex flex-col gap-2">
          <div>
            <p className="text-sm font-semibold text-gray-200 truncate">{m.player1}</p>
            {pick && (
              <WinPctBar
                pct={pick.winner.toLowerCase().includes(m.player1.split(" ").pop()?.toLowerCase() ?? "") || m.player1.toLowerCase().includes(pick.winner.split(" ").pop()?.toLowerCase() ?? "") ? pick.winnerPct : pick.loserPct}
                isWinner={true}
              />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-200 truncate">{m.player2}</p>
            {pick && (
              <WinPctBar
                pct={pick.winner.toLowerCase().includes(m.player2.split(" ").pop()?.toLowerCase() ?? "") || m.player2.toLowerCase().includes(pick.winner.split(" ").pop()?.toLowerCase() ?? "") ? pick.winnerPct : pick.loserPct}
                isWinner={true}
              />
            )}
          </div>
        </div>
      )}

      {/* Footer: date */}
      <p className="text-xs text-gray-700 text-right -mt-1">{formatDate(m.startTime)}</p>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

// fuzzy match player names (last name substring)
function findPick(picks: PickMatch[], player1: string, player2: string): PickMatch | undefined {
  const lastName = (name: string) => name.split(" ").pop()?.toLowerCase() ?? "";
  const l1 = lastName(player1);
  const l2 = lastName(player2);
  return picks.find((p) => {
    const pw = lastName(p.player1);
    const pl = lastName(p.player2);
    return (
      (pw.includes(l1) || l1.includes(pw)) &&
      (pl.includes(l2) || l2.includes(pl))
    ) || (
      (pw.includes(l2) || l2.includes(pw)) &&
      (pl.includes(l1) || l1.includes(pl))
    );
  });
}

export default function LiveScores() {
  const [matches, setMatches] = useState<LiveMatch[]>([]);
  const [picks, setPicks] = useState<PickMatch[]>([]);
  const [fetchedAt, setFetchedAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "live" | "upcoming" | "finished">("upcoming");

  const fetchScores = useCallback(async () => {
    try {
      const [scoresRes, picksRes] = await Promise.all([
        fetch("/api/tennis/livescores"),
        fetch("/api/tennis"),
      ]);
      if (scoresRes.ok) {
        const data = await scoresRes.json();
        setMatches(data.matches ?? []);
        setFetchedAt(data.fetchedAt ?? "");
        if (data.error) setError(data.error);
        else setError("");
      }
      if (picksRes.ok) {
        const pd = await picksRes.json();
        setPicks(pd.matches ?? []);
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScores();
    const i = setInterval(fetchScores, 30_000);
    return () => clearInterval(i);
  }, [fetchScores]);

  // Auto-set smart default filter after data loads
  useEffect(() => {
    if (matches.length === 0) return;
    const hasLive = matches.some((m) => m.state === "in");
    const hasUpcoming = matches.some((m) => m.state === "pre");
    if (hasLive) setFilter("live");
    else if (hasUpcoming) setFilter("upcoming");
    else setFilter("all");
  }, [matches]);

  const live = matches.filter((m) => m.state === "in");
  const upcoming = matches.filter((m) => m.state === "pre");
  const finished = matches.filter((m) => m.state === "post");

  const filtered =
    filter === "live" ? live :
    filter === "upcoming" ? upcoming :
    filter === "finished" ? finished :
    matches;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-base font-bold text-white">Live Scores</h2>

          {/* Today's date */}
          <span className="text-xs text-gray-400 bg-gray-800 border border-gray-700 px-2 py-0.5 rounded-full">
            {new Date().toLocaleDateString("cs-CZ", {
              weekday: "short", day: "numeric", month: "long", timeZone: "Europe/Prague",
            })}
          </span>

          {/* Live count badge */}
          {live.length > 0 && (
            <span className="flex items-center gap-1 text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              {live.length} LIVE
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {fetchedAt && (
            <span className="text-xs text-gray-600">
              Updated {new Date(fetchedAt).toLocaleTimeString("cs-CZ", {
                hour: "2-digit", minute: "2-digit", timeZone: "Europe/Prague",
              })}
            </span>
          )}
          <button onClick={fetchScores} className="text-xs text-gray-400 hover:text-white transition px-2 py-1 rounded bg-gray-800 hover:bg-gray-700">
            ⟳ Refresh
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {([
          ["all", `All (${matches.length})`],
          ["live", `🔴 Live (${live.length})`],
          ["upcoming", `Upcoming (${upcoming.length})`],
          ["finished", `Finished (${finished.length})`],
        ] as const).map(([f, label]) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              filter === f ? "bg-emerald-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && <p className="text-xs text-orange-400 mb-3">⚠ {error}</p>}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-12 text-gray-500 text-sm">
          {filter === "live" ? "No matches live right now." : "No matches found."}
        </div>
      )}

      {/* Match grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((m) => (
          <LiveMatchCard key={m.id} m={m} pick={findPick(picks, m.player1, m.player2)} />
        ))}
      </div>

      <p className="text-xs text-gray-700 mt-4 text-center">
        Data via Livescore · auto-refreshes every 30s
      </p>
    </div>
  );
}
