"use client";

import { useEffect, useState, useCallback } from "react";
import { ValueBet } from "@/lib/types";
import MatchCard from "@/components/MatchCard";
import StatsBar from "@/components/StatsBar";
import Header from "@/components/Header";
import MatchModal, { MatchGroup } from "@/components/MatchModal";

interface MatchSummary {
  id: string;
  sport: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  kickoff: string;
  bookmakerCount: number;
  hasForm: boolean;
  hasH2H: boolean;
}

interface ApiResponse {
  bets: ValueBet[];
  matches: MatchSummary[];
  updatedAt: string;
  mock?: boolean;
  scraping?: boolean;
}

const REFRESH_INTERVAL = 5 * 60 * 1000;

export default function Home() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL / 1000);
  const [sportFilter, setSportFilter] = useState("All");
  const [selected, setSelected] = useState<MatchGroup | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/bets");
      if (res.ok) setData(await res.json());
      setCountdown(REFRESH_INTERVAL / 1000);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const i = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(i);
  }, [fetchData]);

  useEffect(() => {
    const t = setInterval(
      () => setCountdown((c) => (c > 0 ? c - 1 : REFRESH_INTERVAL / 1000)),
      1000
    );
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    document.body.style.overflow = selected ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [selected]);

  const sports = data
    ? ["All", ...Array.from(new Set(data.matches.map((m) => m.sport)))]
    : ["All"];

  const filtered = (data?.matches ?? []).filter(
    (m) => sportFilter === "All" || m.sport === sportFilter
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-8">

        {/* Title */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Match Analysis</h1>
            {data && (
              <p className="text-sm text-gray-400 mt-1">
                {data.scraping ? (
                  <span className="text-yellow-400/80">⟳ Fetching live data…</span>
                ) : data.mock ? (
                  "Demo data"
                ) : (
                  "Live data"
                )}
                {" · "}{data.matches.length} matches · refreshes in {countdown}s
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

        {/* Stats */}
        {data && <StatsBar bets={data.bets} matches={data.matches} />}

        {/* Sport filter */}
        <div className="flex gap-2 flex-wrap mt-6 mb-6">
          {sports.map((s) => (
            <button
              key={s}
              onClick={() => setSportFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                sportFilter === s
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Loading state */}
        {loading && !data && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400">Loading match data…</p>
          </div>
        )}

        {/* Match grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m) => {
            const group: MatchGroup = {
              matchId: m.id,
              sport: m.sport,
              league: m.league,
              homeTeam: m.homeTeam,
              awayTeam: m.awayTeam,
              kickoff: m.kickoff,
              bets: (data?.bets ?? []).filter((b) => b.matchId === m.id),
            };
            return (
              <MatchCard
                key={m.id}
                group={group}
                onClick={() => setSelected(group)}
              />
            );
          })}
        </div>

        {!loading && filtered.length === 0 && (
          <div className="text-center py-24 text-gray-500">No matches found.</div>
        )}
      </main>

      {selected && (
        <MatchModal group={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
