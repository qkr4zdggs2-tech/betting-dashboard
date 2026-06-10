import { NextResponse } from "next/server";

// Prague is UTC+2 (CEST). Livescore uses UTC offset as parameter.
const LS_BASE = "https://prod-public-api.livescore.com/v1/api/app/date/tennis";
const TZ_OFFSET = 2; // CEST

// Only show top-tier tournaments — filter out Challengers, ITF, low-tier WTA
const ALLOWED_KEYWORDS = [
  "atp 250", "atp 500", "atp 1000", "grand slam",
  "wta 250", "wta 500", "wta 1000",
  "wimbledon", "roland garros", "us open", "australian open",
  "libema open", "stuttgart open", "boss open",
  "hsbc championships", "queen's", "queens",
  "eastbourne", "halle", "queens club",
];

const BLOCKED_KEYWORDS = [
  "challenger", "itf", "doubles", "qualifying",
];

function isAllowedTournament(stage: LSStage): boolean {
  const name = (stage.Snm ?? "").toLowerCase();
  const comp = (stage.Cnm ?? "").toLowerCase();
  const combined = `${name} ${comp}`;

  // Block Challengers, ITF, qualifying, doubles
  if (BLOCKED_KEYWORDS.some((b) => combined.includes(b))) return false;

  // Allow only numbered ATP/WTA tiers (250/500/1000) — blocks bare "WTA" or "ATP" without tier
  if (/atp (250|500|1000|grand slam)/i.test(comp)) return true;
  if (/wta (125|250|500|1000|grand slam)/i.test(comp) && !comp.includes("125")) return true;
  if (/wta (250|500|1000)/i.test(comp)) return true;

  // Allow known Grand Slams by name
  if (ALLOWED_KEYWORDS.some((k) => combined.includes(k))) return true;

  return false;
}

function todayStr() {
  const d = new Date();
  // Shift to Prague time
  const prague = new Date(d.getTime() + TZ_OFFSET * 3600 * 1000);
  return prague.toISOString().slice(0, 10).replace(/-/g, "");
}

function parseSetScores(ev: Record<string, string | number | unknown>) {
  const sets1: number[] = [];
  const sets2: number[] = [];
  const tiebreaks: (number | null)[] = [];
  for (let i = 1; i <= 7; i++) {
    const s1 = ev[`Tr1S${i}`];
    const s2 = ev[`Tr2S${i}`];
    if (s1 === undefined || s2 === undefined) break;
    sets1.push(Number(s1));
    sets2.push(Number(s2));
    // Tiebreak info stored in Tr1TB1 / Tr2TB1 etc if present
    const tb1 = ev[`Tr1TB${i}`];
    tiebreaks.push(tb1 !== undefined ? Number(tb1) : null);
  }
  return { sets1, sets2, tiebreaks };
}

function mapStatus(eps: string): "pre" | "in" | "post" {
  if (!eps || eps === "NS") return "pre";
  if (["FT", "Ret.", "W/O", "Canc.", "Def.", "AWD"].includes(eps)) return "post";
  if (eps === "Canc.") return "post";
  // Anything else (set scores like "1. Set", "2. Set", game scores) = live
  return "in";
}

function statusLabel(eps: string): string {
  if (!eps || eps === "NS") return "Not started";
  if (eps === "FT") return "Final";
  if (eps === "Ret.") return "Retired";
  if (eps === "W/O") return "Walkover";
  if (eps === "Canc.") return "Cancelled";
  if (eps === "Def.") return "Default";
  return eps; // e.g. "2nd Set", "40-30", "TB"
}

interface LSEvent {
  Eid: string;
  T1: Array<{ ID: string; Nm: string; Abr?: string; Img?: string }>;
  T2: Array<{ ID: string; Nm: string; Abr?: string; Img?: string }>;
  Tr1?: string;
  Tr2?: string;
  Eps?: string;
  Esd?: number;
  [key: string]: unknown;
}

interface LSStage {
  Sid: string;
  Snm: string;
  Cnm?: string;
  CompId?: string;
  Events?: LSEvent[];
}

export async function GET() {
  try {
    const date = todayStr();
    const url = `${LS_BASE}/${date}/${TZ_OFFSET}?MD=1`;

    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" },
      next: { revalidate: 30 },
    });

    if (!res.ok) {
      return NextResponse.json({ matches: [], error: `Livescore returned ${res.status}`, fetchedAt: new Date().toISOString() });
    }

    const data = await res.json();
    const stages: LSStage[] = data.Stages ?? [];

    const matches = [];

    for (const stage of stages) {
      // Skip Challengers, ITF, and low-tier events
      if (!isAllowedTournament(stage)) continue;

      const tournament = stage.Snm ?? stage.Cnm ?? "Tennis";
      const comp = (stage.Cnm ?? "").toLowerCase();
      const tour = comp.includes("wta") || tournament.toLowerCase().includes("wta") ||
        ["libema open wta", "hsbc", "queens", "eastbourne wta", "wimbledon women", "hsbc championships", "ilkley wta", "modena wta"].some(t => tournament.toLowerCase().includes(t))
        ? "WTA" : "ATP";

      for (const ev of stage.Events ?? []) {
        // Skip doubles — doubles matches have 2 players in T1/T2 arrays
        if ((ev.T1?.length ?? 0) > 1 || (ev.T2?.length ?? 0) > 1) continue;

        const p1 = ev.T1?.[0];
        const p2 = ev.T2?.[0];
        if (!p1 || !p2) continue;

        const eps = String(ev.Eps ?? "NS");
        const state = mapStatus(eps);
        const { sets1, sets2, tiebreaks } = parseSetScores(ev as Record<string, unknown>);

        // Sets won
        const setsWon1 = Number(ev.Tr1 ?? 0);
        const setsWon2 = Number(ev.Tr2 ?? 0);

        // Determine winner
        let winner: string | null = null;
        if (state === "post" && (setsWon1 > 0 || setsWon2 > 0)) {
          winner = setsWon1 > setsWon2 ? p1.Nm : setsWon2 > setsWon1 ? p2.Nm : null;
        }
        if (eps === "Ret." || eps === "Def.") {
          // loser retired — winner is leading player
          winner = setsWon1 >= setsWon2 ? p1.Nm : p2.Nm;
        }

        // Start time from Esd (format: YYYYMMDDHHMMSS)
        let startTime = "";
        if (ev.Esd) {
          const s = String(ev.Esd);
          startTime = `${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}T${s.slice(8,10)}:${s.slice(10,12)}:00Z`;
        }

        matches.push({
          id: ev.Eid,
          tournament,
          tour,
          player1: p1.Nm,
          player1Short: p1.Abr ? `${p1.Abr}` : p1.Nm.split(" ").pop() ?? p1.Nm,
          player2: p2.Nm,
          player2Short: p2.Abr ? `${p2.Abr}` : p2.Nm.split(" ").pop() ?? p2.Nm,
          setsWon1,
          setsWon2,
          sets1,
          sets2,
          tiebreaks,
          state,
          statusText: statusLabel(eps),
          rawStatus: eps,
          winner,
          startTime,
        });
      }
    }

    // Sort: live → upcoming → finished
    const order: Record<string, number> = { in: 0, pre: 1, post: 2 };
    matches.sort((a, b) => (order[a.state] ?? 3) - (order[b.state] ?? 3));

    return NextResponse.json({ matches, fetchedAt: new Date().toISOString() });
  } catch (e) {
    return NextResponse.json({ matches: [], error: String(e), fetchedAt: new Date().toISOString() });
  }
}
