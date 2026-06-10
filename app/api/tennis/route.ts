import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_PATH = path.join(process.cwd(), "data", "tennis-analysis.json");

// ── KV helpers (Vercel KV when available, filesystem fallback locally) ─────────

async function readData() {
  // Try Vercel KV first
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    try {
      const { kv } = await import("@vercel/kv");
      const data = await kv.get("tennis-analysis");
      if (data) return data;
    } catch {
      // fall through to filesystem
    }
  }
  // Filesystem fallback (local dev)
  try {
    const raw = fs.readFileSync(DATA_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return { date: "", generatedAt: "", tournaments: [], matches: [], topPicks: [], upsetAlerts: [], log: [] };
  }
}

async function writeData(data: unknown) {
  // Try Vercel KV first
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    try {
      const { kv } = await import("@vercel/kv");
      await kv.set("tennis-analysis", data);
      return;
    } catch {
      // fall through to filesystem
    }
  }
  // Filesystem fallback (local dev)
  try {
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch {
    // read-only filesystem (Vercel without KV configured)
  }
}

// GET — return current analysis
export async function GET() {
  const data = await readData();
  return NextResponse.json(data);
}

// POST — receive new analysis from the daily routine or manual trigger
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const current = await readData();

    // If posting a full daily analysis
    if (body.matches) {
      const updated = {
        ...body,
        generatedAt: new Date().toISOString(),
        log: (current as { log?: unknown[] }).log || [],
      };
      await writeData(updated);
      return NextResponse.json({ ok: true });
    }

    // If posting a result log entry
    if (body.logEntry) {
      const cur = current as { log?: unknown[] };
      const updated = {
        ...cur,
        log: [body.logEntry, ...(cur.log || [])].slice(0, 200),
      };
      await writeData(updated);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
