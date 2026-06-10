export type Surface = "clay" | "grass" | "hard";
export type Format = "bo3" | "bo5";
export type Outcome = "home" | "away";
export type LineType = "games" | "sets";
export type OverUnder = "over" | "under";
export type Confidence = "low" | "medium" | "high";
export type BagelCall = "safe" | "risk" | "avoid";

export interface OddsEntry {
  bookmaker: string;
  home: number;
  draw: number | null;
  away: number;
}

export interface MatchResult {
  opponent: string;
  goalsFor: number;
  goalsAgainst: number;
  isHome: boolean;
  outcome: "W" | "D" | "L";
  date: string;
}

export interface TeamForm {
  team: string;
  last5: MatchResult[];
  avgGoalsFor: number;
  avgGoalsAgainst: number;
  wins: number;
  draws: number;
  losses: number;
}

export interface H2HRecord {
  homeWins: number;
  draws: number;
  awayWins: number;
  avgHomeGoals: number;
  avgAwayGoals: number;
  recentMatches: Array<{
    date: string;
    homeTeam: string;
    awayTeam: string;
    homeGoals: number;
    awayGoals: number;
  }>;
}

export interface TennisPlayer {
  name: string;
  ranking: number;
  surface_winrate: number;    // 0-1, win rate on this surface last 12m
  avg_games_per_match: number; // on this surface
  hold_pct: number;           // serve hold % on this surface
  recent_form: string[];      // last 5 results: ["W","W","L","W","W"]
  recent_opponents: string[];
  fatigue_matches: number;    // matches played in last 7 days
  injury_note?: string;
}

export interface TennisH2H {
  player1_wins: number;
  player2_wins: number;
  avg_games: number;
  avg_sets: number;
  surface_meetings: number;  // on current surface
  bagels_in_last5: number;
  recent: Array<{
    date: string;
    score: string;  // e.g. "6-4 7-5"
    winner: string;
  }>;
}

export interface TennisMatch {
  id: string;
  tournament: string;
  surface: Surface;
  format: Format;
  player1: TennisPlayer;
  player2: TennisPlayer;
  h2h: TennisH2H;
  kickoff: string;
  sources: string[];  // sources checked
  odds?: OddsEntry[];
}

export interface TennisAnalysis {
  matchId: string;
  player1Name: string;
  player2Name: string;
  tournament: string;
  surface: Surface;
  format: Format;
  kickoff: string;

  // Core analysis text
  analysis: string;

  // Winner
  winnerName: string;
  winnerPct: number;
  loserName: string;
  loserPct: number;
  winnerConfidence: Confidence;

  // Best line
  lineType: LineType;
  lineDirection: OverUnder;
  lineValue: number;
  lineOddsEstimate: number; // our fair estimate
  lineConfidence: Confidence;
  lineReasoning: string;

  // Bagel
  bagelCall: BagelCall;
  bagelReasoning: string;

  // BetBuilder suggestion
  betbuilder: {
    legs: string[];
    reasoning: string;
    combinedOddsEstimate: number;
  };

  // Surface note
  surfaceNote: string;

  // Sources used
  sources: string[];

  generatedAt: string;
}

// Keep these for backward compat
export interface Match {
  id: string;
  sport: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  kickoff: string;
  odds: OddsEntry[];
  homeForm?: TeamForm;
  awayForm?: TeamForm;
  h2h?: H2HRecord;
}

export interface ValueBet {
  matchId: string;
  sport: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  kickoff: string;
  outcome: "home" | "draw" | "away";
  outcomeLabel: string;
  bookmaker: string;
  bookOdds: number;
  trueOdds: number;
  edge: number;
  impliedProb: number;
  trueProb: number;
}

export interface MatchAnalysis {
  matchId: string;
  recommendation: "home" | "draw" | "away" | "no_bet";
  recommendationLabel: string;
  bestBookmaker: string;
  bestOdds: number;
  confidence: number;
  scorePrediction: { homeGoals: number; awayGoals: number; confidence: number };
  summary: string;
  formAnalysis: string;
  oddsAnalysis: string;
  h2hAnalysis: string;
  keyFactors: string[];
  riskLevel: "low" | "medium" | "high";
  valueBets: ValueBet[];
  generatedAt: string;
}
