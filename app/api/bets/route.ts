import { NextResponse } from "next/server";
import { getMatches } from "@/lib/matchCache";
import { findValueBets } from "@/lib/analyzer";

export async function GET() {
  const { matches, mock, scraping } = await getMatches();
  const bets = findValueBets(matches);

  return NextResponse.json({
    bets,
    matches: matches.map((m) => ({
      id: m.id,
      sport: m.sport,
      league: m.league,
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      kickoff: m.kickoff,
      bookmakerCount: m.odds.length,
      hasForm: !!(m.homeForm && m.awayForm),
      hasH2H: !!(m.h2h && m.h2h.recentMatches.length > 0),
    })),
    updatedAt: new Date().toISOString(),
    mock,
    scraping,
  });
}
