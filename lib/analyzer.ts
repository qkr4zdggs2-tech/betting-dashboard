import {
  Match,
  ValueBet,
  MatchAnalysis,
  TeamForm,
  H2HRecord,
} from "./types";

type ScorePrediction = { homeGoals: number; awayGoals: number; confidence: number };

// ── Odds helpers ─────────────────────────────────────────────────────────────

function removeVig(rawProbs: number[]): number[] {
  const total = rawProbs.reduce((a, b) => a + b, 0);
  return rawProbs.map((p) => p / total);
}

function consensusProbabilities(match: Match): {
  home: number;
  draw: number | null;
  away: number;
} {
  const hasDraw = match.odds[0]?.draw !== null;
  const homeProbs: number[] = [];
  const drawProbs: number[] = [];
  const awayProbs: number[] = [];

  for (const o of match.odds) {
    if (!o.home || !o.away || o.home <= 1 || o.away <= 1) continue;
    if (hasDraw && (!o.draw || o.draw <= 1)) continue;
    const raw = hasDraw
      ? [1 / o.home, 1 / o.draw!, 1 / o.away]
      : [1 / o.home, 1 / o.away];
    const fair = removeVig(raw);
    homeProbs.push(fair[0]);
    if (hasDraw) drawProbs.push(fair[1]);
    awayProbs.push(fair[hasDraw ? 2 : 1]);
  }

  const avg = (arr: number[]) =>
    arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

  return {
    home: avg(homeProbs),
    draw: hasDraw ? avg(drawProbs) : null,
    away: avg(awayProbs),
  };
}

// ── Value bet finder ──────────────────────────────────────────────────────────

export function findValueBets(matches: Match[]): ValueBet[] {
  const valueBets: ValueBet[] = [];

  for (const match of matches) {
    if (match.odds.length < 2) continue;
    const cons = consensusProbabilities(match);
    const hasDraw = cons.draw !== null;
    const outcomes: Array<"home" | "draw" | "away"> = hasDraw
      ? ["home", "draw", "away"]
      : ["home", "away"];

    for (const outcome of outcomes) {
      const trueProb =
        outcome === "home"
          ? cons.home
          : outcome === "draw"
          ? cons.draw!
          : cons.away;
      const trueOdds = 1 / trueProb;

      for (const entry of match.odds) {
        const bookOdds =
          outcome === "home"
            ? entry.home
            : outcome === "draw"
            ? entry.draw!
            : entry.away;
        if (!bookOdds || bookOdds <= 1) continue;

        const impliedProb = 1 / bookOdds;
        const edge = (trueProb * bookOdds - 1) * 100;

        if (edge >= 1.5) {
          valueBets.push({
            matchId: match.id,
            sport: match.sport,
            league: match.league,
            homeTeam: match.homeTeam,
            awayTeam: match.awayTeam,
            kickoff: match.kickoff,
            outcome,
            outcomeLabel:
              outcome === "home"
                ? match.homeTeam
                : outcome === "draw"
                ? "Draw"
                : match.awayTeam,
            bookmaker: entry.bookmaker,
            bookOdds,
            trueOdds: Math.round(trueOdds * 100) / 100,
            edge: Math.round(edge * 10) / 10,
            impliedProb: Math.round(impliedProb * 1000) / 10,
            trueProb: Math.round(trueProb * 1000) / 10,
          });
        }
      }
    }
  }

  return valueBets.sort((a, b) => b.edge - a.edge);
}

// ── Form scoring ──────────────────────────────────────────────────────────────

function formScore(form: TeamForm | undefined): number {
  // Returns 0–1 score based on recent form
  if (!form || form.last5.length === 0) return 0.5;
  const pts = form.wins * 3 + form.draws * 1;
  const maxPts = form.last5.length * 3;
  return pts / maxPts;
}

function formText(form: TeamForm | undefined, teamName: string): string {
  if (!form || form.last5.length === 0)
    return `No recent form data available for ${teamName}.`;
  const results = form.last5.map((r) => r.outcome).join("-");
  const trend =
    form.wins >= 3
      ? "in excellent form"
      : form.wins >= 2
      ? "in decent form"
      : form.losses >= 3
      ? "in poor form"
      : "in inconsistent form";
  return `${teamName} are ${trend} (${results}), averaging ${form.avgGoalsFor.toFixed(1)} goals scored and ${form.avgGoalsAgainst.toFixed(1)} conceded over their last ${form.last5.length} matches.`;
}

// ── Score prediction ──────────────────────────────────────────────────────────

function predictScore(match: Match, cons: ReturnType<typeof consensusProbabilities>): ScorePrediction {
  const { homeForm, awayForm, h2h } = match;

  // Base expected goals from odds-implied probabilities
  // Higher home win prob → more expected home goals
  let homeXG = 1.3 + cons.home * 0.8;
  let awayXG = 1.3 + cons.away * 0.8;

  // Adjust for form
  if (homeForm) {
    homeXG = homeXG * 0.5 + homeForm.avgGoalsFor * 0.5;
    awayXG = awayXG * 0.5 + homeForm.avgGoalsAgainst * 0.5;
  }
  if (awayForm) {
    awayXG = awayXG * 0.5 + awayForm.avgGoalsFor * 0.5;
    homeXG = homeXG * 0.5 + awayForm.avgGoalsAgainst * 0.5;
  }

  // Adjust for H2H average goals
  if (h2h && h2h.recentMatches.length >= 3) {
    homeXG = homeXG * 0.7 + h2h.avgHomeGoals * 0.3;
    awayXG = awayXG * 0.7 + h2h.avgAwayGoals * 0.3;
  }

  const homeGoals = Math.round(Math.max(0, homeXG));
  const awayGoals = Math.round(Math.max(0, awayXG));

  // Confidence based on data richness
  const hasForm = !!(homeForm && awayForm);
  const hasH2H = !!(h2h && h2h.recentMatches.length >= 3);
  const bookmakerCount = match.odds.length;
  let confidence = 45;
  if (hasForm) confidence += 20;
  if (hasH2H) confidence += 15;
  if (bookmakerCount >= 4) confidence += 10;
  if (bookmakerCount >= 6) confidence += 5;

  return { homeGoals, awayGoals, confidence: Math.min(confidence, 82) };
}

// ── Written analysis generator ────────────────────────────────────────────────

function oddsAnalysisText(match: Match, cons: ReturnType<typeof consensusProbabilities>): string {
  const bookCount = match.odds.length;
  const bestHome = Math.max(...match.odds.map((o) => o.home));
  const bestAway = Math.max(...match.odds.map((o) => o.away));
  const bestHomeBm = match.odds.find((o) => o.home === bestHome)?.bookmaker ?? "";
  const bestAwayBm = match.odds.find((o) => o.away === bestAway)?.bookmaker ?? "";

  const homeLabel = `${(cons.home * 100).toFixed(1)}%`;
  const awayLabel = `${(cons.away * 100).toFixed(1)}%`;
  const drawLabel = cons.draw ? `draw ${(cons.draw * 100).toFixed(1)}%` : "";

  const spread =
    Math.max(...match.odds.map((o) => o.home)) -
    Math.min(...match.odds.map((o) => o.home));
  const sharpNote =
    spread > 0.2
      ? ` There is notable disagreement between bookmakers on the home odds (spread: ${spread.toFixed(2)}), suggesting market uncertainty.`
      : ` Bookmakers are closely aligned on this market.`;

  return (
    `Based on ${bookCount} bookmaker${bookCount > 1 ? "s" : ""}, the consensus fair probabilities are: ` +
    `home win ${homeLabel}${drawLabel ? `, ${drawLabel}` : ""}, away win ${awayLabel}. ` +
    `Best available: ${match.homeTeam} @ ${bestHome} (${bestHomeBm}), ${match.awayTeam} @ ${bestAway} (${bestAwayBm}).` +
    sharpNote
  );
}

function h2hAnalysisText(h2h: H2HRecord | undefined, homeTeam: string, awayTeam: string): string {
  if (!h2h || h2h.recentMatches.length === 0)
    return "No head-to-head data available for this fixture.";

  const total = h2h.homeWins + h2h.draws + h2h.awayWins;
  const dominant =
    h2h.homeWins > h2h.awayWins * 1.5
      ? `${homeTeam} have historically dominated this fixture`
      : h2h.awayWins > h2h.homeWins * 1.5
      ? `${awayTeam} have the historical edge in this fixture`
      : "This fixture is historically balanced";

  return (
    `In ${total} recent meetings: ${homeTeam} won ${h2h.homeWins}, ${h2h.draws} draws, ${awayTeam} won ${h2h.awayWins}. ` +
    `${dominant}, with an average score of ${h2h.avgHomeGoals.toFixed(1)}-${h2h.avgAwayGoals.toFixed(1)}. ` +
    `${h2h.avgHomeGoals + h2h.avgAwayGoals > 2.5 ? "Games between these sides tend to be high-scoring." : "Games between these sides tend to be tight and low-scoring."}`
  );
}

function buildKeyFactors(
  match: Match,
  cons: ReturnType<typeof consensusProbabilities>,
  recommendation: "home" | "draw" | "away" | "no_bet"
): string[] {
  const factors: string[] = [];
  const { homeForm, awayForm, h2h } = match;

  // Form factors
  if (homeForm) {
    if (homeForm.wins >= 4)
      factors.push(`${match.homeTeam} won ${homeForm.wins} of last ${homeForm.last5.length} games`);
    if (homeForm.avgGoalsFor >= 2.0)
      factors.push(`${match.homeTeam} averaging ${homeForm.avgGoalsFor.toFixed(1)} goals/game recently`);
    if (homeForm.avgGoalsAgainst >= 2.0)
      factors.push(`${match.homeTeam} leaking ${homeForm.avgGoalsAgainst.toFixed(1)} goals/game — defensive concern`);
  }
  if (awayForm) {
    if (awayForm.losses >= 3)
      factors.push(`${match.awayTeam} lost ${awayForm.losses} of last ${awayForm.last5.length} — poor away run`);
    if (awayForm.wins >= 3)
      factors.push(`${match.awayTeam} in strong form with ${awayForm.wins} wins`);
  }

  // Odds factors
  const spread = Math.max(...match.odds.map((o) => o.home)) - Math.min(...match.odds.map((o) => o.home));
  if (spread > 0.25)
    factors.push(`Market divided on home odds — ${spread.toFixed(2)} spread between books`);

  const valueBetCount = findValueBets([match]).length;
  if (valueBetCount > 0)
    factors.push(`${valueBetCount} value bet${valueBetCount > 1 ? "s" : ""} detected across bookmakers`);

  // H2H
  if (h2h) {
    if (h2h.homeWins >= 4)
      factors.push(`${match.homeTeam} won ${h2h.homeWins} of last ${h2h.homeWins + h2h.draws + h2h.awayWins} H2H meetings`);
    if (h2h.avgHomeGoals + h2h.avgAwayGoals > 3)
      factors.push("H2H history points to a high-scoring game");
  }

  // Confidence in recommendation
  const recProb =
    recommendation === "home"
      ? cons.home
      : recommendation === "away"
      ? cons.away
      : recommendation === "draw"
      ? cons.draw ?? 0
      : 0;
  if (recProb > 0.6)
    factors.push(`Strong ${recommendation === "home" ? match.homeTeam : recommendation === "away" ? match.awayTeam : "draw"} probability at ${(recProb * 100).toFixed(0)}%`);

  return factors.slice(0, 5);
}

// ── Main analysis function ────────────────────────────────────────────────────

export function analyzeMatch(match: Match): MatchAnalysis {
  const cons = consensusProbabilities(match);
  const valueBets = findValueBets([match]);
  const score = predictScore(match, cons);

  // Determine recommendation
  let recommendation: "home" | "draw" | "away" | "no_bet" = "no_bet";
  const minConfidence = 0.42; // must be at least this probable

  // Prefer outcome with a value bet AND highest probability
  const sortedByProb: Array<{ outcome: "home" | "draw" | "away"; prob: number }> = ([
    { outcome: "home" as const, prob: cons.home },
    { outcome: "away" as const, prob: cons.away },
    ...(cons.draw !== null ? [{ outcome: "draw" as const, prob: cons.draw }] : []),
  ] as Array<{ outcome: "home" | "draw" | "away"; prob: number }>).sort((a, b) => b.prob - a.prob);

  const valueOutcomes = new Set(valueBets.map((v) => v.outcome));

  // First try: highest-prob outcome that also has a value bet
  for (const { outcome, prob } of sortedByProb) {
    if (prob >= minConfidence && valueOutcomes.has(outcome)) {
      recommendation = outcome;
      break;
    }
  }
  // Fallback: just highest-prob outcome if strong enough
  if (recommendation === "no_bet") {
    const top = sortedByProb[0];
    if (top.prob >= 0.50) recommendation = top.outcome;
  }

  // Best bookmaker for the recommendation
  let bestBookmaker = "";
  let bestOdds = 0;
  if (recommendation !== "no_bet") {
    for (const o of match.odds) {
      const odds =
        recommendation === "home" ? o.home : recommendation === "away" ? o.away : o.draw ?? 0;
      if (odds > bestOdds) {
        bestOdds = odds;
        bestBookmaker = o.bookmaker;
      }
    }
  }

  // Confidence in recommendation
  const recProb =
    recommendation === "home"
      ? cons.home
      : recommendation === "away"
      ? cons.away
      : recommendation === "draw"
      ? cons.draw ?? 0
      : 0;

  const hasForm = !!(match.homeForm && match.awayForm);
  const hasH2H = !!(match.h2h && match.h2h.recentMatches.length > 0);
  let confidence = Math.round(recProb * 80);
  if (hasForm) confidence = Math.min(confidence + 10, 88);
  if (hasH2H) confidence = Math.min(confidence + 7, 88);
  if (valueBets.some((v) => v.outcome === recommendation)) confidence = Math.min(confidence + 5, 92);

  // Risk level
  const riskLevel: "low" | "medium" | "high" =
    confidence >= 70 ? "low" : confidence >= 55 ? "medium" : "high";

  // Recommendation label
  const recommendationLabel =
    recommendation === "home"
      ? match.homeTeam
      : recommendation === "away"
      ? match.awayTeam
      : recommendation === "draw"
      ? "Draw"
      : "No Bet";

  // Written texts
  const formAnalysis =
    [
      formText(match.homeForm, match.homeTeam),
      formText(match.awayForm, match.awayTeam),
    ].join(" ");

  const oddsAnalysis = oddsAnalysisText(match, cons);
  const h2hAnalysis = h2hAnalysisText(match.h2h, match.homeTeam, match.awayTeam);

  const homeFormScore = formScore(match.homeForm);
  const awayFormScore = formScore(match.awayForm);
  const formEdge =
    homeFormScore - awayFormScore > 0.2
      ? `${match.homeTeam} hold a form advantage`
      : awayFormScore - homeFormScore > 0.2
      ? `${match.awayTeam} come in with the better recent form`
      : "both sides enter on similar form";

  const summary =
    recommendation === "no_bet"
      ? `This match does not offer a clear enough edge to recommend a bet. The market is competitive with ${(cons.home * 100).toFixed(0)}% / ${cons.draw ? (cons.draw * 100).toFixed(0) + "% / " : ""}${(cons.away * 100).toFixed(0)}% consensus probabilities.`
      : `Our analysis across ${match.odds.length} bookmakers${hasForm ? ", team form" : ""}${hasH2H ? ", and H2H history" : ""} points to a **${recommendationLabel}** result. ` +
        `The consensus gives ${recommendationLabel} a ${(recProb * 100).toFixed(0)}% true probability, and ${formEdge}. ` +
        `Best odds available: ${bestOdds} at ${bestBookmaker}.`;

  const keyFactors = buildKeyFactors(match, cons, recommendation);

  return {
    matchId: match.id,
    recommendation,
    recommendationLabel,
    bestBookmaker,
    bestOdds,
    confidence,
    scorePrediction: score,
    summary,
    formAnalysis,
    oddsAnalysis,
    h2hAnalysis,
    keyFactors,
    riskLevel,
    valueBets,
    generatedAt: new Date().toISOString(),
  };
}
