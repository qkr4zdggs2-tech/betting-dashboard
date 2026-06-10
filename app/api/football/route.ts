import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_PATH = path.join(process.cwd(), "data", "football-analysis.json");

async function readData() {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    try {
      const { kv } = await import("@vercel/kv");
      const data = await kv.get("football-analysis");
      if (data) return data;
    } catch { /* fall through */ }
  }
  try {
    const raw = fs.readFileSync(DATA_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return { date: "", generatedAt: "", tournament: "", matches: [], topPicks: [], upsetAlerts: [], log: [] };
  }
}

async function writeData(data: unknown) {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    try {
      const { kv } = await import("@vercel/kv");
      await kv.set("football-analysis", data);
      return;
    } catch { /* fall through */ }
  }
  try {
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch { /* read-only on Vercel */ }
}

export async function GET() {
  const data = await readData();
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const current = await readData() as { log?: unknown[] };

    if (body.matches) {
      const updated = { ...body, generatedAt: new Date().toISOString(), log: current.log || [] };
      await writeData(updated);
      return NextResponse.json({ ok: true });
    }

    if (body.logEntry) {
      const updated = { ...current, log: [body.logEntry, ...(current.log || [])].slice(0, 200) };
      await writeData(updated);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
