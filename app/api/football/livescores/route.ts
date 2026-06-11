import { NextResponse } from "next/server";

// Livescore soccer feed. Prague is UTC+2 (CEST).
const LS_BASE = "https://prod-public-api.livescore.com/v1/api/app/date/soccer";
const TZ_OFFSET = 2; // CEST

// Only show FIFA World Cup matches
const ALLOWED_KEYWORDS = ["world cup", "fifa world cup", "wc 2026"];

function isWorldCup(stage: LSStage): boolean {
  const name = (stage.Snm ?? "").toLowerCase();
  const comp = (stage.Cnm ?? "").toLowerCase();
  const ccd = (stage.Ccd ?? "").toLowerCase();
  const combined = `${name} ${comp} ${ccd}`;
  return ALLOWED_KEYWORDS.some((k) => combined.includes(k));
}

function todayStr() {
  const d = new Date();
  const prague = new Date(d.getTime() + TZ_OFFSET * 3600 * 1000);
  return prague.toISOString().slice(0, 10).replace(/-/g, "");
}

function mapStatus(eps: string): "pre" | "in" | "post" {
  if (!eps || eps === "NS") return "pre";
  if (["FT", "AET", "Pen.", "Canc.", "Postp.", "Abn.", "AWD"].includes(eps)) return "post";
  // HT, minute markers ("45'", "67'"), "1st Half" etc = live
  return "in";
}

function statusLabel(eps: string): string {
  if (!eps || eps === "NS") return "Not started";
  if (eps === "FT") return "Final";
  if (eps === "AET") return "After extra time";
  if (eps === "Pen.") return "Penalties";
  if (eps === "HT") return "Half time";
  if (eps === "Canc.") return "Cancelled";
  if (eps === "Postp.") return "Postponed";
  return eps; // minute marker like "67'"
}

interface LSEvent {
  Eid: string;
  T1: Array<{ ID: string; Nm: string; Abr?: string; Img?: string }>;
  T2: Array<{ ID: string; Nm: string; Abr?: string; Img?: string }>;
  Tr1?: string; // home goals
  Tr2?: string; // away goals
  Eps?: string; // status
  Esd?: number; // start datetime YYYYMMDDHHMMSS
  [key: string]: unknown;
}

interface LSStage {
  Sid: string;
  Snm: string;
  Cnm?: string;
  Ccd?: string;
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
      if (!isWorldCup(stage)) continue;

      const tournament = stage.Snm ?? stage.Cnm ?? "World Cup";

      for (const ev of stage.Events ?? []) {
        const t1 = ev.T1?.[0];
        const t2 = ev.T2?.[0];
        if (!t1 || !t2) continue;

        const eps = String(ev.Eps ?? "NS");
        const state = mapStatus(eps);

        const goals1 = ev.Tr1 !== undefined ? Number(ev.Tr1) : null;
        const goals2 = ev.Tr2 !== undefined ? Number(ev.Tr2) : null;

        let winner: string | null = null;
        if (state === "post" && goals1 != null && goals2 != null) {
          winner = goals1 > goals2 ? t1.Nm : goals2 > goals1 ? t2.Nm : null;
        }

        let startTime = "";
        if (ev.Esd) {
          const s = String(ev.Esd);
          startTime = `${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}T${s.slice(8,10)}:${s.slice(10,12)}:00Z`;
        }

        matches.push({
          id: ev.Eid,
          tournament,
          home: t1.Nm,
          away: t2.Nm,
          homeShort: t1.Abr ?? t1.Nm.slice(0, 3).toUpperCase(),
          awayShort: t2.Abr ?? t2.Nm.slice(0, 3).toUpperCase(),
          goals1,
          goals2,
          state,
          statusText: statusLabel(eps),
          rawStatus: eps,
          winner,
          startTime,
        });
      }
    }

    const order: Record<string, number> = { in: 0, pre: 1, post: 2 };
    matches.sort((a, b) => (order[a.state] ?? 3) - (order[b.state] ?? 3));

    return NextResponse.json({ matches, fetchedAt: new Date().toISOString() });
  } catch (e) {
    return NextResponse.json({ matches: [], error: String(e), fetchedAt: new Date().toISOString() });
  }
}
