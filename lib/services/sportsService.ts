import type { SportsGame, SportsTeam } from "@/types/familyHub";
import { mockDelay } from "./mockDelay";
import { seedData } from "@/data/seed";

type ESPNLeaguePath =
  | "basketball/nba"
  | "football/nfl"
  | "basketball/mens-college-basketball";

const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports";

const leagueToEspnPath = (league: SportsTeam["league"]): ESPNLeaguePath => {
  switch (league) {
    case "NBA":
      return "basketball/nba";
    case "NFL":
      return "football/nfl";
    case "NCAA":
      return "basketball/mens-college-basketball";
    // Not in seed yet, but keep a sane fallback.
    default:
      return "basketball/nba";
  }
};

interface ESPNTeam {
  id: string;
  abbreviation?: string;
  displayName?: string;
  shortDisplayName?: string;
  color?: string;
}

type ESPNTeamsResponse = {
  sports?: Array<{
    leagues?: Array<{
      teams?: Array<{ team: ESPNTeam }>;
    }>;
  }>;
};

interface ESPNCompetitor {
  homeAway: "home" | "away" | string;
  team: { id: string; abbreviation?: string; shortDisplayName?: string; displayName?: string };
  score?: string;
}

interface ESPNCompetition {
  competitors: ESPNCompetitor[];
  venue?: { fullName?: string };
  links?: Array<{ href?: string; text?: string }>;
  startDate?: string;
}

interface ESPNEvent {
  id?: string;
  date?: string;
  status?: { type?: { description?: string } };
  competitions?: ESPNCompetition[];
}

type ESPNScoreboardResponse = {
  events?: ESPNEvent[];
};

const teamsCache = new Map<ESPNLeaguePath, Array<ESPNTeam>>();
const scoreboardCache = new Map<string, ESPNScoreboardResponse>();

function toYYYYMMDD(date: Date) {
  const iso = date.toISOString().slice(0, 10);
  return iso.replace(/-/g, "");
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return (await res.json()) as unknown as T;
}

async function getEspnTeamsForLeague(leaguePath: ESPNLeaguePath): Promise<ESPNTeam[]> {
  const cached = teamsCache.get(leaguePath);
  if (cached) return cached;

  const url = `${ESPN_BASE}/${leaguePath}/teams`;
  const data = await fetchJson<ESPNTeamsResponse>(url);

  const teams = data.sports?.[0]?.leagues?.[0]?.teams?.map((t) => t.team) ?? [];
  teamsCache.set(leaguePath, teams);
  return teams;
}

async function getEspnScoreboard(leaguePath: ESPNLeaguePath, dateStr: string): Promise<ESPNScoreboardResponse> {
  const cacheKey = `${leaguePath}:${dateStr}`;
  const cached = scoreboardCache.get(cacheKey);
  if (cached) return cached;

  const isNcaam = leaguePath === "basketball/mens-college-basketball";
  const url = isNcaam
    ? `${ESPN_BASE}/${leaguePath}/scoreboard?dates=${dateStr}&limit=500&groups=50`
    : `${ESPN_BASE}/${leaguePath}/scoreboard?dates=${dateStr}`;

  const data = await fetchJson<ESPNScoreboardResponse>(url);
  scoreboardCache.set(cacheKey, data);
  return data;
}

function statusFromEspnDescription(desc?: string): SportsGame["status"] {
  const d = (desc ?? "").toLowerCase();
  if (d.includes("final")) return "final";
  if (d.includes("live")) return "live";
  return "scheduled";
}

function toSportsTeamFallback(params: { league: SportsTeam["league"]; abbreviation?: string; displayName?: string }): SportsTeam {
  return {
    id: `espn_${params.abbreviation ?? "UNK"}_${params.displayName ?? "TEAM"}`,
    name: params.displayName ?? params.abbreviation ?? "Opponent",
    abbreviation: params.abbreviation ?? "OPP",
    league: params.league,
    color: "#9ca3af",
  };
}

export const sportsService = {
  async getAllTeams(): Promise<SportsTeam[]> {
    await mockDelay(250);
    return seedData.sportsTeams;
  },

  async searchTeams(query: string): Promise<SportsTeam[]> {
    await mockDelay(250);
    const q = query.trim().toLowerCase();
    if (!q) return seedData.sportsTeams;
    return seedData.sportsTeams.filter((t) => t.name.toLowerCase().includes(q) || t.abbreviation.toLowerCase().includes(q));
  },

  async getTeamsWidgetData(teamIds: string[]): Promise<Array<{ team: SportsTeam; latestGame: SportsGame; nextGame: SportsGame; opponent: SportsTeam }>> {
    // Small delay to keep loading states consistent with existing UX.
    await mockDelay(350);

    const teamsById = new Map(seedData.sportsTeams.map((t) => [t.id, t]));
    const selected = teamIds.map((id) => teamsById.get(id)).filter(Boolean) as SportsTeam[];

    const allTeamsByLeague = new Map<SportsTeam["league"], SportsTeam[]>();
    for (const t of seedData.sportsTeams) {
      const arr = allTeamsByLeague.get(t.league) ?? [];
      arr.push(t);
      allTeamsByLeague.set(t.league, arr);
    }

    const results = await Promise.all(
      selected.map(async (team) => {
        try {
          const leaguePath = leagueToEspnPath(team.league);
          const espnTeams = await getEspnTeamsForLeague(leaguePath);
          const espnTeam =
            espnTeams.find((t) => (t.abbreviation ?? "").toUpperCase() === team.abbreviation.toUpperCase()) ??
            espnTeams.find((t) => (t.displayName ?? "").toLowerCase().includes(team.name.toLowerCase().slice(0, 8)));

          if (!espnTeam?.id) throw new Error("ESPN team not found for selected team");

          const espnTeamId = espnTeam.id;

          // Latest game: search backwards until we find a Final/Live.
          let latestEvent: ESPNEvent | undefined;
          for (let back = 0; back < 10; back++) {
            const date = new Date(Date.now() - back * 86_400_000);
            const dateStr = toYYYYMMDD(date);
            const board = await getEspnScoreboard(leaguePath, dateStr);
            const events = board.events ?? [];
            const match = events.find((ev) => {
              const comp = ev.competitions?.[0];
              const contenders = comp?.competitors ?? [];
              return contenders.some((c) => c.team?.id === espnTeamId);
            });
            if (!match) continue;
            const desc = match.status?.type?.description;
            const status = statusFromEspnDescription(desc);
            if (status === "final" || status === "live") {
              latestEvent = match;
              break;
            }
          }

          // Next game: search forward until scheduled.
          let nextEvent: ESPNEvent | undefined;
          for (let forward = 0; forward < 14; forward++) {
            const date = new Date(Date.now() + forward * 86_400_000);
            const dateStr = toYYYYMMDD(date);
            const board = await getEspnScoreboard(leaguePath, dateStr);
            const events = board.events ?? [];
            const scheduled = events
              .map((ev) => {
                const comp = ev.competitions?.[0];
                const contenders = comp?.competitors ?? [];
                const hasTeam = contenders.some((c) => c.team?.id === espnTeamId);
                if (!hasTeam) return null;
                const desc = ev.status?.type?.description;
                const status = statusFromEspnDescription(desc);
                if (status !== "scheduled") return null;
                return ev;
              })
              .filter(Boolean)[0] as ESPNEvent | undefined;

            if (scheduled) {
              nextEvent = scheduled;
              break;
            }
          }

          const makeGame = (event: ESPNEvent | undefined, status: SportsGame["status"], fallbackId: string): SportsGame => {
            const comp = event?.competitions?.[0];
            const contenders = comp?.competitors ?? [];
            if (contenders.length < 2 || !event) {
              // If we can't parse ESPN properly, fall back to a lightweight mock.
              const startAt = new Date(Date.now()).toISOString();
              return {
                id: fallbackId,
                startAt,
                homeTeamId: team.id,
                awayTeamId: team.id,
                status,
                venue: undefined,
                externalUrl: "https://www.espn.com/",
              };
            }

            const home = contenders.find((c) => c.homeAway === "home") ?? contenders[0];
            const away = contenders.find((c) => c.homeAway !== "home") ?? contenders[1];

            const homeScore = home.score !== undefined ? Number(home.score) : undefined;
            const awayScore = away.score !== undefined ? Number(away.score) : undefined;
            const externalUrl = event?.competitions?.[0]?.links?.[0]?.href ?? "https://www.espn.com/";
            const venue = comp?.venue?.fullName;

            return {
              id: `${fallbackId}_${event.id ?? "game"}`,
              startAt: event.date ?? new Date().toISOString(),
              homeTeamId: home.team?.abbreviation ? (allTeamsByLeague.get(team.league) ?? []).find((t) => t.abbreviation.toUpperCase() === (home.team.abbreviation ?? "").toUpperCase())?.id ?? team.id : team.id,
              awayTeamId: away.team?.abbreviation ? (allTeamsByLeague.get(team.league) ?? []).find((t) => t.abbreviation.toUpperCase() === (away.team.abbreviation ?? "").toUpperCase())?.id ?? team.id : team.id,
              homeScore,
              awayScore,
              status,
              venue,
              externalUrl,
            };
          };

          const latestStatus = statusFromEspnDescription(latestEvent?.status?.type?.description);
          const nextStatus = statusFromEspnDescription(nextEvent?.status?.type?.description);

          // Opponent: pick the other competitor in nextEvent if available; else latestEvent.
          const opponentFromEvent = (event: ESPNEvent | undefined) => {
            const comp = event?.competitions?.[0];
            const contenders = comp?.competitors ?? [];
            const target = contenders.find((c) => c.team?.id === espnTeamId);
            if (!target) return undefined;
            const other = contenders.find((c) => c.team?.id !== espnTeamId);
            if (!other) return undefined;

            const leagueTeams = allTeamsByLeague.get(team.league) ?? [];
            const opponentSeed =
              leagueTeams.find((t) => (t.abbreviation ?? "").toUpperCase() === (other.team.abbreviation ?? "").toUpperCase()) ??
              leagueTeams.find((t) => (other.team.shortDisplayName ?? "").toLowerCase().includes(t.name.toLowerCase().slice(0, 6)));

            return (
              opponentSeed ??
              toSportsTeamFallback({
                league: team.league,
                abbreviation: other.team.abbreviation,
                displayName: other.team.shortDisplayName ?? other.team.displayName,
              })
            );
          };

          const opponent = opponentFromEvent(nextEvent) ?? opponentFromEvent(latestEvent) ?? toSportsTeamFallback({ league: team.league, abbreviation: "OPP", displayName: "Opponent" });

          return {
            team,
            latestGame: makeGame(latestEvent, latestStatus === "scheduled" ? "final" : latestStatus, `lg_${team.id}`),
            nextGame: makeGame(nextEvent, nextStatus, `ng_${team.id}`),
            opponent,
          };
        } catch {
          // If ESPN parsing fails, preserve the mock experience.
          const now = new Date();
          const latestStart = new Date(now.getTime() - 1000 * 60 * 60 * 3).toISOString();
          const nextStart = new Date(now.getTime() + 1000 * 60 * 60 * 2).toISOString();
          const fallbackOpponent = seedData.sportsTeams.find((t) => t.id !== team.id) ?? team;
          const latestGame: SportsGame = {
            id: `lg_${team.id}`,
            startAt: latestStart,
            homeTeamId: team.id,
            awayTeamId: fallbackOpponent.id,
            homeScore: 100,
            awayScore: 98,
            status: "final",
            venue: "Mock Arena",
            externalUrl: "https://www.espn.com/",
          };
          const nextGame: SportsGame = {
            id: `ng_${team.id}`,
            startAt: nextStart,
            homeTeamId: team.id,
            awayTeamId: fallbackOpponent.id,
            status: "scheduled",
            venue: "Mock Arena",
            externalUrl: "https://www.espn.com/",
          };
          return { team, latestGame, nextGame, opponent: fallbackOpponent };
        }
      })
    );

    return results;
  },
};

