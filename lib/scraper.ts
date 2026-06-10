import { chromium, Browser, BrowserContext } from "playwright";
import { Match, OddsEntry, TeamForm, H2HRecord, MatchResult } from "./types";

// Re-export types that other files import from here
export type { Match, OddsEntry, TeamForm, H2HRecord };
export { findValueBets } from "./analyzer";
export type { ValueBet, MatchAnalysis } from "./types";

async function scrapeOdds(
  context: BrowserContext,
  matchId: string
): Promise<OddsEntry[]> {
  const odds: OddsEntry[] = [];
  const page = await context.newPage();
  try {
    const cleanId = matchId.replace(/^g_\d_/, "");
    await page.goto(
      `https://www.flashscore.com/match/${cleanId}/#/odds-comparison/1x2-odds/full-time`,
      { waitUntil: "domcontentloaded", timeout: 20000 }
    );
    await page.waitForTimeout(2000);
    const rows = await page.$$(".ui-table__row");
    for (const row of rows.slice(0, 12)) {
      try {
        const bookmaker = await row.$eval(
          ".oddsCell__bookmaker",
          (el) => el.textContent?.trim() ?? ""
        );
        const cells = await row.$$(".oddsCell__odd");
        if (cells.length < 2) continue;
        const homeOdds = parseFloat((await cells[0].textContent())?.trim() ?? "0");
        const drawOdds =
          cells.length >= 3
            ? parseFloat((await cells[1].textContent())?.trim() ?? "0")
            : null;
        const awayOdds = parseFloat(
          (await cells[cells.length - 1].textContent())?.trim() ?? "0"
        );
        if (homeOdds > 1 && awayOdds > 1) {
          odds.push({
            bookmaker,
            home: homeOdds,
            draw: drawOdds && drawOdds > 1 ? drawOdds : null,
            away: awayOdds,
          });
        }
      } catch {}
    }
  } catch {}
  await page.close();
  return odds;
}

async function scrapeTeamForm(
  context: BrowserContext,
  teamName: string,
  matchUrl: string
): Promise<TeamForm | undefined> {
  const page = await context.newPage();
  try {
    // Navigate to the match page and look at recent form section
    await page.goto(matchUrl + "#/h2h/overall", {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });
    await page.waitForTimeout(2000);

    const last5: MatchResult[] = [];

    // Try to grab form rows from h2h/form section
    const rows = await page.$$(".h2h__section .h2h__row");
    let count = 0;
    for (const row of rows) {
      if (count >= 5) break;
      try {
        const homeEl = await row.$(".h2h__homeParticipant");
        const awayEl = await row.$(".h2h__awayParticipant");
        const scoreEl = await row.$(".h2h__result");
        if (!homeEl || !awayEl || !scoreEl) continue;

        const home = (await homeEl.textContent())?.trim() ?? "";
        const away = (await awayEl.textContent())?.trim() ?? "";
        const scoreText = (await scoreEl.textContent())?.trim() ?? "";
        const [hg, ag] = scoreText.split(":").map(Number);
        if (isNaN(hg) || isNaN(ag)) continue;

        const isHome = home.includes(teamName.split(" ")[0]);
        const goalsFor = isHome ? hg : ag;
        const goalsAgainst = isHome ? ag : hg;
        const outcome: "W" | "D" | "L" =
          goalsFor > goalsAgainst ? "W" : goalsFor === goalsAgainst ? "D" : "L";

        last5.push({
          opponent: isHome ? away : home,
          goalsFor,
          goalsAgainst,
          isHome,
          outcome,
          date: new Date().toISOString().split("T")[0],
        });
        count++;
      } catch {}
    }

    if (last5.length === 0) return undefined;

    const avgGoalsFor = last5.reduce((a, b) => a + b.goalsFor, 0) / last5.length;
    const avgGoalsAgainst =
      last5.reduce((a, b) => a + b.goalsAgainst, 0) / last5.length;

    return {
      team: teamName,
      last5,
      avgGoalsFor: Math.round(avgGoalsFor * 10) / 10,
      avgGoalsAgainst: Math.round(avgGoalsAgainst * 10) / 10,
      wins: last5.filter((r) => r.outcome === "W").length,
      draws: last5.filter((r) => r.outcome === "D").length,
      losses: last5.filter((r) => r.outcome === "L").length,
    };
  } catch {
    return undefined;
  } finally {
    await page.close();
  }
}

async function scrapeH2H(
  context: BrowserContext,
  homeTeam: string,
  awayTeam: string,
  matchUrl: string
): Promise<H2HRecord | undefined> {
  const page = await context.newPage();
  try {
    await page.goto(matchUrl + "#/h2h/home-away", {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });
    await page.waitForTimeout(2000);

    const rows = await page.$$(".h2h__section .h2h__row");
    const recentMatches: H2HRecord["recentMatches"] = [];
    let homeWins = 0, draws = 0, awayWins = 0;
    let totalHomeGoals = 0, totalAwayGoals = 0;

    for (const row of rows.slice(0, 6)) {
      try {
        const homeEl = await row.$(".h2h__homeParticipant");
        const awayEl = await row.$(".h2h__awayParticipant");
        const scoreEl = await row.$(".h2h__result");
        const dateEl = await row.$(".h2h__date");
        if (!homeEl || !awayEl || !scoreEl) continue;

        const home = (await homeEl.textContent())?.trim() ?? "";
        const away = (await awayEl.textContent())?.trim() ?? "";
        const scoreText = (await scoreEl.textContent())?.trim() ?? "";
        const dateText = (await dateEl?.textContent())?.trim() ?? "";
        const [hg, ag] = scoreText.split(":").map(Number);
        if (isNaN(hg) || isNaN(ag)) continue;

        totalHomeGoals += hg;
        totalAwayGoals += ag;

        if (hg > ag) homeWins++;
        else if (hg === ag) draws++;
        else awayWins++;

        recentMatches.push({
          date: dateText,
          homeTeam: home,
          awayTeam: away,
          homeGoals: hg,
          awayGoals: ag,
        });
      } catch {}
    }

    if (recentMatches.length === 0) return undefined;

    return {
      homeWins,
      draws,
      awayWins,
      avgHomeGoals:
        Math.round((totalHomeGoals / recentMatches.length) * 10) / 10,
      avgAwayGoals:
        Math.round((totalAwayGoals / recentMatches.length) * 10) / 10,
      recentMatches,
    };
  } catch {
    return undefined;
  } finally {
    await page.close();
  }
}

async function scrapeMatchList(
  context: BrowserContext,
  sport: "football" | "tennis"
): Promise<Array<Omit<Match, "odds"> & { url: string }>> {
  const page = await context.newPage();
  const matches: Array<Omit<Match, "odds"> & { url: string }> = [];

  try {
    await page.goto(`https://www.flashscore.com/${sport}/`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await page.waitForTimeout(3000);

    try {
      await page.click("#onetrust-accept-btn-handler", { timeout: 4000 });
      await page.waitForTimeout(500);
    } catch {}

    const rows = await page.$$(".event__match");
    for (const row of rows.slice(0, 15)) {
      try {
        const homeTeam = await row.$eval(
          ".event__homeParticipant",
          (el) => el.textContent?.trim() ?? ""
        );
        const awayTeam = await row.$eval(
          ".event__awayParticipant",
          (el) => el.textContent?.trim() ?? ""
        );
        const timeEl = await row.$(".event__time");
        const timeText = (await timeEl?.textContent()) ?? "";
        const id = (await row.getAttribute("id")) ?? Math.random().toString();

        if (!homeTeam || !awayTeam) continue;
        if (/^\d+['"]$/.test(timeText.trim())) continue;

        const now = new Date();
        let kickoff = new Date();
        if (/^\d{2}:\d{2}$/.test(timeText.trim())) {
          const [hh, mm] = timeText.trim().split(":").map(Number);
          kickoff.setHours(hh, mm, 0, 0);
          if (kickoff < now) kickoff.setDate(kickoff.getDate() + 1);
        }

        const cleanId = id.replace(/^g_\d_/, "");
        const url = `https://www.flashscore.com/match/${cleanId}/`;

        matches.push({
          id,
          sport: sport === "football" ? "Football" : "Tennis",
          league: sport === "football" ? "Football" : "Tennis",
          homeTeam,
          awayTeam,
          kickoff: kickoff.toISOString(),
          url,
        });
      } catch {}
    }
  } catch {}

  await page.close();
  return matches;
}

export async function scrapeAll(): Promise<Match[]> {
  let browser: Browser | null = null;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    });

    const [footballList, tennisList] = await Promise.all([
      scrapeMatchList(context, "football"),
      scrapeMatchList(context, "tennis"),
    ]);

    const allMatches = [...footballList, ...tennisList].slice(0, 12);

    const withData: Match[] = [];
    for (let i = 0; i < allMatches.length; i += 3) {
      const batch = allMatches.slice(i, i + 3);
      const results = await Promise.all(
        batch.map(async ({ url, ...m }) => {
          const [odds, homeForm, awayForm, h2h] = await Promise.all([
            scrapeOdds(context, m.id),
            scrapeTeamForm(context, m.homeTeam, url),
            scrapeTeamForm(context, m.awayTeam, url),
            scrapeH2H(context, m.homeTeam, m.awayTeam, url),
          ]);
          return { ...m, odds, homeForm, awayForm, h2h };
        })
      );
      withData.push(...results.filter((m) => m.odds.length >= 2));
    }

    return withData;
  } finally {
    await browser?.close();
  }
}
