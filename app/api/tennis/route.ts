import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_PATH = path.join(process.cwd(), "data", "tennis-analysis.json");

function readData() {
  try {
    const raw = fs.readFileSync(DATA_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return { date: "", generatedAt: "", tournaments: [], matches: [], topPicks: [], upsetAlerts: [], log: [] };
  }
}

function writeData(data: unknown) {
  try {
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch {
    // On Vercel (read-only filesystem) writes are silently ignored
    // Data is updated via redeployment from GitHub
  }
}

// GET — return current analysis
export async function GET() {
  const data = readData();
  return NextResponse.json(data);
}

// POST — receive new analysis from the daily routine or manual trigger
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const current = readData();

    // If posting a full daily analysis
    if (body.matches) {
      const updated = {
        ...body,
        generatedAt: new Date().toISOString(),
        log: current.log || [],
      };
      writeData(updated);
      return NextResponse.json({ ok: true });
    }

    // If posting a result log entry (outcome of a past pick)
    if (body.logEntry) {
      const updated = {
        ...current,
        log: [body.logEntry, ...(current.log || [])].slice(0, 200),
      };
      writeData(updated);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
