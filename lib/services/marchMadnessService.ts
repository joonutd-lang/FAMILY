import type { MarchMadnessGame, MarchMadnessStatus, MarchMadnessTeam } from "@/types/familyHub";
import { mockDelay } from "./mockDelay";

const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball";

function toYYYYMMDD(date: Date) {
  const iso = date.toISOString().slice(0, 10);
  return iso.replace(/-/g, "");
}

function statusFromEspnDescription(desc?: string): MarchMadnessStatus {
  const d = (desc ?? "").toLowerCase();
  if (d.includes("live") || d.includes("in progress")) return "live";
  if (d.includes("final")) return "final";
  return "scheduled";
}

type ESPNCompetitor = {
  id?: string;
  team?: {
    id?: string | number;
    abbreviation?: string;
    shortDisplayName?: string;
    displayName?: string;
  };
  score?: string;
  homeAway?: "home" | "away" | string;
};

type ESPNCompetition = {
  competitors?: ESPNCompetitor[];
  venue?: { fullName?: string };
  links?: Array<{ href?: string }>;
};

type ESPNEvent = {
  id?: string;
  date?: string;
  status?: { type?: { description?: string } };
  competitions?: ESPNCompetition[];
  links?: Array<{ href?: string; text?: string; shortText?: string }>;
};

type ESPNScoreboardResponse = {
  events?: ESPNEvent[];
};

export const marchMadnessService = {
  async getScoreboardForDate(params: { date: Date }): Promise<MarchMadnessGame[]> {
    await mockDelay(300);

    const dateStr = toYYYYMMDD(params.date);
    const url =
      `${ESPN_BASE}/scoreboard?dates=${dateStr}&limit=500&groups=50` +
      `&seasonType=2`;

    const res = await fetch(url, { method: "GET" });
    if (!res.ok) throw new Error(`March Madness request failed: ${res.status}`);
    const data = (await res.json()) as ESPNScoreboardResponse;

    const events = data.events ?? [];

    const games: MarchMadnessGame[] = [];
    for (const ev of events) {
      const comp = ev.competitions?.[0];
      const competitors = comp?.competitors ?? [];
      if (!comp || competitors.length < 2) continue;

      const home = competitors.find((c) => c.homeAway === "home") ?? competitors[0];
      const away = competitors.find((c) => c.homeAway !== "home") ?? competitors[1];

      const homeTeam: MarchMadnessTeam = {
        id: String(home.team?.id ?? home.id ?? "H"),
        name: home.team?.shortDisplayName ?? home.team?.displayName ?? home.team?.abbreviation ?? "Home",
        abbreviation: home.team?.abbreviation,
      };
      const awayTeam: MarchMadnessTeam = {
        id: String(away.team?.id ?? away.id ?? "A"),
        name: away.team?.shortDisplayName ?? away.team?.displayName ?? away.team?.abbreviation ?? "Away",
        abbreviation: away.team?.abbreviation,
      };

      const startAt = ev.date ?? (comp as any)?.startDate ?? new Date().toISOString();
      const status: MarchMadnessStatus = statusFromEspnDescription(ev.status?.type?.description);

      const externalUrl =
        ev.links?.[0]?.href ??
        comp.links?.[0]?.href ??
        "https://www.espn.com/";

      games.push({
        id: String(ev.id ?? `${homeTeam.id}_${awayTeam.id}_${startAt}`),
        startAt,
        status,
        homeTeam,
        awayTeam,
        homeScore: home.score !== undefined ? Number(home.score) : undefined,
        awayScore: away.score !== undefined ? Number(away.score) : undefined,
        venue: comp.venue?.fullName,
        externalUrl,
      });
    }

    // sort: live first, then soonest
    const score = (s: MarchMadnessStatus) => (s === "live" ? 0 : s === "scheduled" ? 1 : 2);
    games.sort((a, b) => score(a.status) - score(b.status) || new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

    return games;
  },
};

