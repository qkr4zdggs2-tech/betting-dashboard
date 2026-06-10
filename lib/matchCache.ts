import { Match } from "./types";
import { mockMatches } from "./mockData";
import { scrapeAll } from "./scraper";

let _matches: Match[] = mockMatches(); // seed with mock immediately
let _lastFetch = 0;
let _scraping = false;
let _mock = true;
const CACHE_TTL = 5 * 60 * 1000;

/** Start a background scrape — never blocks the caller */
function triggerScrape() {
  if (_scraping) return;
  _scraping = true;
  scrapeAll()
    .then((scraped) => {
      if (scraped.length > 0) {
        _matches = scraped;
        _mock = false;
      }
      _lastFetch = Date.now();
    })
    .catch(() => {
      // keep existing mock data
      _lastFetch = Date.now();
    })
    .finally(() => {
      _scraping = false;
    });
}

/** Returns instantly — always has data (mock until real data arrives) */
export async function getMatches(): Promise<{ matches: Match[]; mock: boolean; scraping: boolean }> {
  const stale = Date.now() - _lastFetch > CACHE_TTL;
  if (stale && !_scraping) {
    triggerScrape(); // fire-and-forget
  }
  return { matches: _matches, mock: _mock, scraping: _scraping };
}

export function getMatch(id: string): Match | undefined {
  return _matches.find((m) => m.id === id);
}
