"use client";

import { useEffect, useState, useCallback } from "react";

interface LiveMatch {
  id: string;
  tournament: string;
  home: string;
  away: string;
  homeShort: string;
  awayShort: string;
  goals1: number | null;
  goals2: number | null;
  state: "pre" | "in" | "post";
  statusText: string;
  rawStatus: string;
  winner: string | null;
  startTime: string;
}

interface PickMatch {
  home: string;
  away: string;
  winner: string;
  winnerPct: number;
  drawPct: number;
  loser: string;
  loserPct: number;
}

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

function WinPctBar({ pct, isWinner }: { pct: number; isWinner: boolean }) {
  if (!pct) return null;
  return (
    <div className="flex items-center gap-1 mt-0.5">
      <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${pct >= 60 ? "bg-emerald-500" : pct >= 40 ? "bg-yellow-500" : "bg-orange-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-xs font-bold tabular-nums ${
        isWinner
          ? pct >= 60 ? "text-emerald-400" : pct >= 40 ? "text-yellow-400" : "text-orange-400"
          : "text-gray-500"
      }`}>{pct}%</span>
    </div>
  );
}

// fuzzy match team to a pick side
function pctFor(team: string, pick: PickMatch): number {
  const low = (s: string) => s.toLowerCase();
  const t = low(team);
  if (low(pick.winner).includes(t) || t.includes(low(pick.winner))) return pick.winnerPct;
  if (low(pick.loser).includes(t) || t.includes(low(pick.loser))) return pick.loserPct;
  return 0;
}

function TeamRow({ name, goals, isWinner, state, pct }: {
  name: string; goals: number | null; isWinner: boolean; state: string; pct: number | null;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="min-w-0 flex-1">
        <div className={`text-sm font-medium truncate ${state === "post" && isWinner ? "text-white" : "text-gray-300"}`}>
          {name}
          {state === "post" && isWinner && <span className="text-emerald-400 ml-1">✓</span>}
        </div>
        {pct != null && pct > 0 && <WinPctBar pct={pct} isWinner={isWinner || state !== "post"} />}
      </div>
      {goals != null && (
        <span className={`text-lg font-bold tabular-nums shrink-0 ${
          state === "in" ? "text-yellow-400" :
          state === "post" && isWinner ? "text-emerald-400" : "text-gray-300"
        }`}>{goals}</span>
      )}
    </div>
  );
}

function LiveMatchCard({ m, pick }: { m: LiveMatch; pick?: PickMatch }) {
  const isLive = m.state === "in";
  const isDone = m.state === "post";
  const isPre = m.state === "pre";
  const homeWins = m.winner === m.home;
  const awayWins = m.winner === m.away;
  const isDraw = isDone && m.goals1 != null && m.goals1 === m.goals2;

  return (
    <div className={`bg-gray-900 border rounded-xl p-4 flex flex-col gap-3 ${
      isLive ? "border-red-500/40 shadow-sm shadow-red-900/20" :
      isDone ? "border-gray-800 opacity-80" :
      "border-gray-800"
    }`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-green-900/40 text-green-400">⚽</span>
          <span className="text-xs text-gray-500 truncate">{m.tournament}</span>
        </div>
        {isLive && (
          <span className="flex items-center gap-1 text-xs font-bold text-red-400 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            {m.rawStatus === "HT" ? "HT" : m.rawStatus.match(/\d/) ? m.rawStatus : "LIVE"}
          </span>
        )}
        {isDone && <span className="text-xs text-gray-600 shrink-0">{m.statusText === "Final" ? "FT" : m.statusText}</span>}
        {isPre && <span className="text-xs text-gray-500 shrink-0 font-medium">{formatTime(m.startTime)}</span>}
      </div>

      <div className="flex flex-col gap-2">
        <TeamRow name={m.home} goals={m.goals1} isWinner={homeWins} state={m.state} pct={pick ? pctFor(m.home, pick) : null} />
        <TeamRow name={m.away} goals={m.goals2} isWinner={awayWins} state={m.state} pct={pick ? pctFor(m.away, pick) : null} />
      </div>

      {isDraw && <p className="text-xs text-yellow-400/70 text-center -mt-1">Draw</p>}
      <p className="text-xs text-gray-700 text-right -mt-1">{formatDate(m.startTime)}</p>
    </div>
  );
}

function findPick(picks: PickMatch[], home: string, away: string): PickMatch | undefined {
  const low = (s: string) => s.toLowerCase();
  return picks.find((p) => {
    const ph = low(p.home), pa = low(p.away), h = low(home), a = low(away);
    return (ph.includes(h) || h.includes(ph) || pa.includes(a) || a.includes(pa)) ||
           (ph.includes(a) || a.includes(ph) || pa.includes(h) || h.includes(pa));
  });
}

export default function FootballLiveScores() {
  const [matches, setMatches] = useState<LiveMatch[]>([]);
  const [picks, setPicks] = useState<PickMatch[]>([]);
  const [fetchedAt, setFetchedAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "live" | "upcoming" | "finished">("all");

  const fetchScores = useCallback(async () => {
    try {
      const [scoresRes, picksRes] = await Promise.all([
        fetch("/api/football/livescores"),
        fetch("/api/football"),
      ]);
      if (scoresRes.ok) {
        const data = await scoresRes.json();
        setMatches(data.matches ?? []);
        setFetchedAt(data.fetchedAt ?? "");
        setError(data.error ?? "");
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
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-base font-bold text-white">Live Scores</h2>
          <span className="text-xs text-gray-400 bg-gray-800 border border-gray-700 px-2 py-0.5 rounded-full">
            {new Date().toLocaleDateString("cs-CZ", { weekday: "short", day: "numeric", month: "long", timeZone: "Europe/Prague" })}
          </span>
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
              Updated {new Date(fetchedAt).toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Prague" })}
            </span>
          )}
          <button onClick={fetchScores} className="text-xs text-gray-400 hover:text-white transition px-2 py-1 rounded bg-gray-800 hover:bg-gray-700">
            ⟳ Refresh
          </button>
        </div>
      </div>

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
              filter === f ? "bg-green-700 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && <p className="text-xs text-orange-400 mb-3">⚠ {error}</p>}

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-12 text-gray-500 text-sm">
          {filter === "live" ? "No matches live right now." : "No World Cup matches today."}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((m) => (
          <LiveMatchCard key={m.id} m={m} pick={findPick(picks, m.home, m.away)} />
        ))}
      </div>

      <p className="text-xs text-gray-700 mt-4 text-center">
        Data via Livescore · auto-refreshes every 30s
      </p>
    </div>
  );
}
