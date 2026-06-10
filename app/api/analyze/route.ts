import { NextRequest, NextResponse } from "next/server";
import { getMatches, getMatch } from "@/lib/matchCache";
import { analyzeMatch } from "@/lib/analyzer";

export async function GET(req: NextRequest) {
  const matchId = req.nextUrl.searchParams.get("id");
  if (!matchId) {
    return NextResponse.json({ error: "Missing match id" }, { status: 400 });
  }

  await getMatches(); // ensure cache is seeded (instant)

  const match = getMatch(matchId);
  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  const analysis = analyzeMatch(match);
  return NextResponse.json(analysis);
}
