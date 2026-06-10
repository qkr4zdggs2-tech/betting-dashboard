import { Match } from "./types";

export function mockMatches(): Match[] {
  const now = new Date();
  const h = (n: number) =>
    new Date(now.getTime() + n * 3600 * 1000).toISOString();

  return [
    // ── FOOTBALL ─────────────────────────────────────────────────────────────
    {
      id: "f1",
      sport: "Football",
      league: "Czech First League",
      homeTeam: "Sparta Prague",
      awayTeam: "Slavia Prague",
      kickoff: h(2),
      odds: [
        { bookmaker: "Betano",   home: 2.35, draw: 3.40, away: 3.10 },
        { bookmaker: "Tipsport", home: 2.10, draw: 3.35, away: 3.25 },
        { bookmaker: "Fortuna",  home: 2.08, draw: 3.30, away: 3.30 },
        { bookmaker: "Unibet",   home: 2.12, draw: 3.38, away: 3.22 },
      ],
      homeForm: {
        team: "Sparta Prague",
        last5: [
          { opponent: "Plzen", goalsFor: 3, goalsAgainst: 1, isHome: true,  outcome: "W", date: "2026-06-01" },
          { opponent: "Liberec", goalsFor: 2, goalsAgainst: 0, isHome: false, outcome: "W", date: "2026-05-25" },
          { opponent: "Teplice", goalsFor: 1, goalsAgainst: 1, isHome: true,  outcome: "D", date: "2026-05-18" },
          { opponent: "Brno",   goalsFor: 2, goalsAgainst: 1, isHome: false, outcome: "W", date: "2026-05-11" },
          { opponent: "Ostrava", goalsFor: 0, goalsAgainst: 2, isHome: true,  outcome: "L", date: "2026-05-04" },
        ],
        avgGoalsFor: 1.6, avgGoalsAgainst: 1.0, wins: 3, draws: 1, losses: 1,
      },
      awayForm: {
        team: "Slavia Prague",
        last5: [
          { opponent: "Jablonec", goalsFor: 4, goalsAgainst: 0, isHome: true,  outcome: "W", date: "2026-06-01" },
          { opponent: "Mlada Boleslav", goalsFor: 1, goalsAgainst: 2, isHome: false, outcome: "L", date: "2026-05-25" },
          { opponent: "Olomouc", goalsFor: 2, goalsAgainst: 2, isHome: true,  outcome: "D", date: "2026-05-18" },
          { opponent: "Hradec",  goalsFor: 3, goalsAgainst: 0, isHome: false, outcome: "W", date: "2026-05-11" },
          { opponent: "Karvina", goalsFor: 2, goalsAgainst: 1, isHome: true,  outcome: "W", date: "2026-05-04" },
        ],
        avgGoalsFor: 2.4, avgGoalsAgainst: 1.0, wins: 3, draws: 1, losses: 1,
      },
      h2h: {
        homeWins: 4, draws: 3, awayWins: 3,
        avgHomeGoals: 1.6, avgAwayGoals: 1.4,
        recentMatches: [
          { date: "2025-12-10", homeTeam: "Sparta Prague", awayTeam: "Slavia Prague", homeGoals: 2, awayGoals: 1 },
          { date: "2025-05-08", homeTeam: "Slavia Prague", awayTeam: "Sparta Prague", homeGoals: 3, awayGoals: 0 },
          { date: "2024-12-15", homeTeam: "Sparta Prague", awayTeam: "Slavia Prague", homeGoals: 1, awayGoals: 1 },
          { date: "2024-05-12", homeTeam: "Slavia Prague", awayTeam: "Sparta Prague", homeGoals: 0, awayGoals: 2 },
        ],
      },
    },
    {
      id: "f2",
      sport: "Football",
      league: "Premier League",
      homeTeam: "Arsenal",
      awayTeam: "Chelsea",
      kickoff: h(4),
      odds: [
        { bookmaker: "Betano",   home: 2.40, draw: 3.50, away: 2.80 },
        { bookmaker: "Tipsport", home: 2.35, draw: 3.45, away: 2.85 },
        { bookmaker: "Fortuna",  home: 2.38, draw: 3.80, away: 2.82 },
        { bookmaker: "Unibet",   home: 2.36, draw: 3.48, away: 2.84 },
        { bookmaker: "Pinnacle", home: 2.34, draw: 3.44, away: 2.87 },
      ],
      homeForm: {
        team: "Arsenal",
        last5: [
          { opponent: "Man City",  goalsFor: 1, goalsAgainst: 0, isHome: false, outcome: "W", date: "2026-06-02" },
          { opponent: "Everton",   goalsFor: 3, goalsAgainst: 1, isHome: true,  outcome: "W", date: "2026-05-26" },
          { opponent: "Liverpool", goalsFor: 2, goalsAgainst: 2, isHome: true,  outcome: "D", date: "2026-05-19" },
          { opponent: "Brighton",  goalsFor: 2, goalsAgainst: 0, isHome: false, outcome: "W", date: "2026-05-12" },
          { opponent: "Wolves",    goalsFor: 4, goalsAgainst: 1, isHome: true,  outcome: "W", date: "2026-05-05" },
        ],
        avgGoalsFor: 2.4, avgGoalsAgainst: 0.8, wins: 4, draws: 1, losses: 0,
      },
      awayForm: {
        team: "Chelsea",
        last5: [
          { opponent: "Man United", goalsFor: 2, goalsAgainst: 3, isHome: true,  outcome: "L", date: "2026-06-02" },
          { opponent: "Aston Villa", goalsFor: 1, goalsAgainst: 1, isHome: false, outcome: "D", date: "2026-05-26" },
          { opponent: "Spurs",      goalsFor: 2, goalsAgainst: 2, isHome: true,  outcome: "D", date: "2026-05-19" },
          { opponent: "Brentford",  goalsFor: 3, goalsAgainst: 0, isHome: false, outcome: "W", date: "2026-05-12" },
          { opponent: "Fulham",     goalsFor: 0, goalsAgainst: 1, isHome: true,  outcome: "L", date: "2026-05-05" },
        ],
        avgGoalsFor: 1.6, avgGoalsAgainst: 1.4, wins: 1, draws: 2, losses: 2,
      },
      h2h: {
        homeWins: 5, draws: 3, awayWins: 2,
        avgHomeGoals: 2.0, avgAwayGoals: 1.2,
        recentMatches: [
          { date: "2025-11-03", homeTeam: "Arsenal", awayTeam: "Chelsea", homeGoals: 3, awayGoals: 1 },
          { date: "2025-04-22", homeTeam: "Chelsea", awayTeam: "Arsenal", homeGoals: 1, awayGoals: 2 },
          { date: "2024-10-14", homeTeam: "Arsenal", awayTeam: "Chelsea", homeGoals: 2, awayGoals: 2 },
          { date: "2024-04-23", homeTeam: "Chelsea", awayTeam: "Arsenal", homeGoals: 0, awayGoals: 5 },
        ],
      },
    },
    {
      id: "f3",
      sport: "Football",
      league: "Bundesliga",
      homeTeam: "Bayern Munich",
      awayTeam: "Borussia Dortmund",
      kickoff: h(3),
      odds: [
        { bookmaker: "Betano",   home: 1.72, draw: 4.20, away: 4.50 },
        { bookmaker: "Tipsport", home: 1.75, draw: 4.10, away: 4.40 },
        { bookmaker: "Fortuna",  home: 1.80, draw: 4.00, away: 4.30 },
        { bookmaker: "Unibet",   home: 1.74, draw: 4.15, away: 5.20 },
        { bookmaker: "Pinnacle", home: 1.71, draw: 4.12, away: 4.62 },
      ],
      homeForm: {
        team: "Bayern Munich",
        last5: [
          { opponent: "Bayer Leverkusen", goalsFor: 3, goalsAgainst: 0, isHome: true,  outcome: "W", date: "2026-06-01" },
          { opponent: "RB Leipzig",       goalsFor: 2, goalsAgainst: 1, isHome: false, outcome: "W", date: "2026-05-25" },
          { opponent: "Wolfsburg",        goalsFor: 4, goalsAgainst: 2, isHome: true,  outcome: "W", date: "2026-05-18" },
          { opponent: "Freiburg",         goalsFor: 1, goalsAgainst: 1, isHome: false, outcome: "D", date: "2026-05-11" },
          { opponent: "Stuttgart",        goalsFor: 5, goalsAgainst: 0, isHome: true,  outcome: "W", date: "2026-05-04" },
        ],
        avgGoalsFor: 3.0, avgGoalsAgainst: 0.8, wins: 4, draws: 1, losses: 0,
      },
      awayForm: {
        team: "Borussia Dortmund",
        last5: [
          { opponent: "Frankfurt",   goalsFor: 1, goalsAgainst: 2, isHome: false, outcome: "L", date: "2026-06-01" },
          { opponent: "Mainz",       goalsFor: 3, goalsAgainst: 1, isHome: true,  outcome: "W", date: "2026-05-25" },
          { opponent: "Hoffenheim",  goalsFor: 2, goalsAgainst: 2, isHome: false, outcome: "D", date: "2026-05-18" },
          { opponent: "Augsburg",    goalsFor: 4, goalsAgainst: 0, isHome: true,  outcome: "W", date: "2026-05-11" },
          { opponent: "Union Berlin", goalsFor: 0, goalsAgainst: 2, isHome: false, outcome: "L", date: "2026-05-04" },
        ],
        avgGoalsFor: 2.0, avgGoalsAgainst: 1.4, wins: 2, draws: 1, losses: 2,
      },
      h2h: {
        homeWins: 7, draws: 2, awayWins: 1,
        avgHomeGoals: 3.1, avgAwayGoals: 1.3,
        recentMatches: [
          { date: "2025-11-30", homeTeam: "Bayern Munich", awayTeam: "Borussia Dortmund", homeGoals: 4, awayGoals: 0 },
          { date: "2025-04-05", homeTeam: "Borussia Dortmund", awayTeam: "Bayern Munich", homeGoals: 1, awayGoals: 2 },
          { date: "2024-11-02", homeTeam: "Bayern Munich", awayTeam: "Borussia Dortmund", homeGoals: 3, awayGoals: 2 },
          { date: "2024-03-30", homeTeam: "Borussia Dortmund", awayTeam: "Bayern Munich", homeGoals: 0, awayGoals: 4 },
        ],
      },
    },
    {
      id: "f4",
      sport: "Football",
      league: "La Liga",
      homeTeam: "Real Madrid",
      awayTeam: "Atletico Madrid",
      kickoff: h(5),
      odds: [
        { bookmaker: "Betano",   home: 1.90, draw: 3.60, away: 3.80 },
        { bookmaker: "Tipsport", home: 1.95, draw: 3.55, away: 3.70 },
        { bookmaker: "Fortuna",  home: 1.88, draw: 3.58, away: 3.75 },
        { bookmaker: "Unibet",   home: 1.92, draw: 4.40, away: 3.72 },
      ],
      homeForm: {
        team: "Real Madrid",
        last5: [
          { opponent: "Barcelona",   goalsFor: 3, goalsAgainst: 2, isHome: false, outcome: "W", date: "2026-06-01" },
          { opponent: "Sevilla",     goalsFor: 4, goalsAgainst: 0, isHome: true,  outcome: "W", date: "2026-05-25" },
          { opponent: "Villarreal",  goalsFor: 2, goalsAgainst: 1, isHome: false, outcome: "W", date: "2026-05-18" },
          { opponent: "Celta Vigo",  goalsFor: 1, goalsAgainst: 1, isHome: true,  outcome: "D", date: "2026-05-11" },
          { opponent: "Osasuna",     goalsFor: 3, goalsAgainst: 0, isHome: false, outcome: "W", date: "2026-05-04" },
        ],
        avgGoalsFor: 2.6, avgGoalsAgainst: 0.8, wins: 4, draws: 1, losses: 0,
      },
      awayForm: {
        team: "Atletico Madrid",
        last5: [
          { opponent: "Valencia",  goalsFor: 1, goalsAgainst: 0, isHome: true,  outcome: "W", date: "2026-06-01" },
          { opponent: "Betis",     goalsFor: 0, goalsAgainst: 0, isHome: false, outcome: "D", date: "2026-05-25" },
          { opponent: "Girona",    goalsFor: 2, goalsAgainst: 1, isHome: true,  outcome: "W", date: "2026-05-18" },
          { opponent: "Sociedad",  goalsFor: 1, goalsAgainst: 2, isHome: false, outcome: "L", date: "2026-05-11" },
          { opponent: "Espanyol",  goalsFor: 3, goalsAgainst: 0, isHome: true,  outcome: "W", date: "2026-05-04" },
        ],
        avgGoalsFor: 1.4, avgGoalsAgainst: 0.6, wins: 3, draws: 1, losses: 1,
      },
      h2h: {
        homeWins: 5, draws: 4, awayWins: 1,
        avgHomeGoals: 1.8, avgAwayGoals: 0.9,
        recentMatches: [
          { date: "2026-01-26", homeTeam: "Real Madrid", awayTeam: "Atletico Madrid", homeGoals: 2, awayGoals: 1 },
          { date: "2025-09-29", homeTeam: "Atletico Madrid", awayTeam: "Real Madrid", homeGoals: 1, awayGoals: 1 },
          { date: "2025-01-26", homeTeam: "Real Madrid", awayTeam: "Atletico Madrid", homeGoals: 3, awayGoals: 1 },
          { date: "2024-09-29", homeTeam: "Atletico Madrid", awayTeam: "Real Madrid", homeGoals: 0, awayGoals: 1 },
        ],
      },
    },
    // ── TENNIS ──────────────────────────────────────────────────────────────
    {
      id: "t1",
      sport: "Tennis",
      league: "ATP Roland Garros",
      homeTeam: "Novak Djokovic",
      awayTeam: "Carlos Alcaraz",
      kickoff: h(1.5),
      odds: [
        { bookmaker: "Betano",   home: 2.10, draw: null, away: 1.72 },
        { bookmaker: "Tipsport", home: 2.05, draw: null, away: 1.75 },
        { bookmaker: "Fortuna",  home: 2.55, draw: null, away: 1.70 },
        { bookmaker: "Unibet",   home: 2.08, draw: null, away: 1.73 },
        { bookmaker: "Pinnacle", home: 2.04, draw: null, away: 1.76 },
      ],
      homeForm: {
        team: "Novak Djokovic",
        last5: [
          { opponent: "Zverev",    goalsFor: 2, goalsAgainst: 0, isHome: false, outcome: "W", date: "2026-06-04" },
          { opponent: "Ruud",      goalsFor: 2, goalsAgainst: 1, isHome: false, outcome: "W", date: "2026-06-02" },
          { opponent: "Berrettini", goalsFor: 2, goalsAgainst: 0, isHome: false, outcome: "W", date: "2026-05-31" },
          { opponent: "Medvedev",  goalsFor: 1, goalsAgainst: 2, isHome: false, outcome: "L", date: "2026-05-28" },
          { opponent: "Rune",      goalsFor: 2, goalsAgainst: 1, isHome: false, outcome: "W", date: "2026-05-26" },
        ],
        avgGoalsFor: 1.8, avgGoalsAgainst: 0.8, wins: 4, draws: 0, losses: 1,
      },
      awayForm: {
        team: "Carlos Alcaraz",
        last5: [
          { opponent: "Sinner",    goalsFor: 2, goalsAgainst: 1, isHome: false, outcome: "W", date: "2026-06-04" },
          { opponent: "Tsitsipas", goalsFor: 2, goalsAgainst: 0, isHome: false, outcome: "W", date: "2026-06-02" },
          { opponent: "Fritz",     goalsFor: 2, goalsAgainst: 0, isHome: false, outcome: "W", date: "2026-05-31" },
          { opponent: "Hurkacz",   goalsFor: 2, goalsAgainst: 1, isHome: false, outcome: "W", date: "2026-05-28" },
          { opponent: "Paul",      goalsFor: 2, goalsAgainst: 0, isHome: false, outcome: "W", date: "2026-05-25" },
        ],
        avgGoalsFor: 2.0, avgGoalsAgainst: 0.4, wins: 5, draws: 0, losses: 0,
      },
      h2h: {
        homeWins: 3, draws: 0, awayWins: 4,
        avgHomeGoals: 1.6, avgAwayGoals: 1.8,
        recentMatches: [
          { date: "2026-01-26", homeTeam: "Djokovic", awayTeam: "Alcaraz", homeGoals: 2, awayGoals: 3 },
          { date: "2025-07-14", homeTeam: "Alcaraz",  awayTeam: "Djokovic", homeGoals: 3, awayGoals: 1 },
          { date: "2025-06-09", homeTeam: "Djokovic", awayTeam: "Alcaraz", homeGoals: 2, awayGoals: 1 },
          { date: "2024-11-08", homeTeam: "Djokovic", awayTeam: "Alcaraz", homeGoals: 2, awayGoals: 3 },
        ],
      },
    },
    {
      id: "t2",
      sport: "Tennis",
      league: "ATP Roland Garros",
      homeTeam: "Alexander Zverev",
      awayTeam: "Casper Ruud",
      kickoff: h(4),
      odds: [
        { bookmaker: "Betano",   home: 1.85, draw: null, away: 1.95 },
        { bookmaker: "Tipsport", home: 1.82, draw: null, away: 1.98 },
        { bookmaker: "Fortuna",  home: 1.84, draw: null, away: 1.96 },
        { bookmaker: "Unibet",   home: 2.30, draw: null, away: 1.94 },
        { bookmaker: "Pinnacle", home: 1.88, draw: null, away: 1.92 },
      ],
      homeForm: {
        team: "Alexander Zverev",
        last5: [
          { opponent: "Medvedev", goalsFor: 2, goalsAgainst: 0, isHome: false, outcome: "W", date: "2026-06-03" },
          { opponent: "Rune",     goalsFor: 2, goalsAgainst: 1, isHome: false, outcome: "W", date: "2026-06-01" },
          { opponent: "Hurkacz",  goalsFor: 1, goalsAgainst: 2, isHome: false, outcome: "L", date: "2026-05-29" },
          { opponent: "Fritz",    goalsFor: 2, goalsAgainst: 0, isHome: false, outcome: "W", date: "2026-05-27" },
          { opponent: "Paul",     goalsFor: 2, goalsAgainst: 1, isHome: false, outcome: "W", date: "2026-05-25" },
        ],
        avgGoalsFor: 1.8, avgGoalsAgainst: 0.8, wins: 4, draws: 0, losses: 1,
      },
      awayForm: {
        team: "Casper Ruud",
        last5: [
          { opponent: "Tsitsipas", goalsFor: 2, goalsAgainst: 0, isHome: false, outcome: "W", date: "2026-06-03" },
          { opponent: "Musetti",   goalsFor: 2, goalsAgainst: 1, isHome: false, outcome: "W", date: "2026-06-01" },
          { opponent: "Auger",     goalsFor: 2, goalsAgainst: 0, isHome: false, outcome: "W", date: "2026-05-29" },
          { opponent: "Norrie",    goalsFor: 0, goalsAgainst: 2, isHome: false, outcome: "L", date: "2026-05-27" },
          { opponent: "Dimitrov",  goalsFor: 2, goalsAgainst: 1, isHome: false, outcome: "W", date: "2026-05-25" },
        ],
        avgGoalsFor: 1.6, avgGoalsAgainst: 0.8, wins: 4, draws: 0, losses: 1,
      },
      h2h: {
        homeWins: 5, draws: 0, awayWins: 3,
        avgHomeGoals: 1.9, avgAwayGoals: 1.4,
        recentMatches: [
          { date: "2025-10-30", homeTeam: "Zverev", awayTeam: "Ruud", homeGoals: 2, awayGoals: 1 },
          { date: "2025-06-06", homeTeam: "Ruud",   awayTeam: "Zverev", homeGoals: 1, awayGoals: 2 },
          { date: "2024-10-28", homeTeam: "Zverev", awayTeam: "Ruud", homeGoals: 2, awayGoals: 0 },
        ],
      },
    },
  ];
}
