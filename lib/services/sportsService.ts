import type { SportsGame, SportsTeam } from "@/types/familyHub";
import { mockDelay } from "./mockDelay";
import { seedData } from "@/data/seed";

const seededNow = () => {
  const d = new Date();
  return d.getUTCHours() * 3600 + d.getUTCMinutes() * 60 + d.getUTCSeconds();
};

function makeGame(params: {
  id: string;
  startAt: string;
  homeTeam: SportsTeam;
  awayTeam: SportsTeam;
  status: SportsGame["status"];
  homeScore?: number;
  awayScore?: number;
  externalUrl?: string;
}): SportsGame {
  return {
    id: params.id,
    startAt: params.startAt,
    homeTeamId: params.homeTeam.id,
    awayTeamId: params.awayTeam.id,
    homeScore: params.homeScore,
    awayScore: params.awayScore,
    status: params.status,
    venue: "Mock Arena",
    externalUrl: params.externalUrl ?? "https://www.espn.com/",
  };
}

function pseudoScore(teamIndex: number) {
  const n = seededNow();
  const v = (n + teamIndex * 73) % 7;
  return 90 + v * 2; // for basketball-ish feel; still mock for any league
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

  async getTeamsWidgetData(teamIds: string[]): Promise<
    Array<{ team: SportsTeam; latestGame: SportsGame; nextGame: SportsGame; opponent: SportsTeam }>
  > {
    await mockDelay(500);
    const teamsById = new Map(seedData.sportsTeams.map((t) => [t.id, t]));
    const selected = teamIds.map((id) => teamsById.get(id)).filter(Boolean) as SportsTeam[];
    const others = seedData.sportsTeams.filter((t) => !teamIds.includes(t.id));
    const now = new Date();

    return selected.map((team, idx) => {
      const opponent = others[idx % Math.max(1, others.length)] ?? seedData.sportsTeams[(idx + 1) % seedData.sportsTeams.length];

      const latestStart = new Date(now.getTime() - (1000 * 60 * 60 * (2 + (idx % 4)))); // 2-5 hours ago
      const latestGame = makeGame({
        id: `lg_${team.id}`,
        startAt: latestStart.toISOString(),
        homeTeam: idx % 2 === 0 ? team : opponent,
        awayTeam: idx % 2 === 0 ? opponent : team,
        status: "final",
        homeScore: pseudoScore(idx),
        awayScore: pseudoScore(idx + 2) - 1,
        externalUrl: "https://www.espn.com/scores",
      });

      const nextStart = new Date(now.getTime() + 1000 * 60 * (90 + (idx % 5) * 45)); // ~1.5-3h
      const nextGame = makeGame({
        id: `ng_${team.id}`,
        startAt: nextStart.toISOString(),
        homeTeam: idx % 2 === 0 ? opponent : team,
        awayTeam: idx % 2 === 0 ? team : opponent,
        status: "scheduled",
        externalUrl: "https://www.espn.com/matchup",
      });

      // Normalize opponent relative to the team
      const normalizedOpponent = opponent;

      return { team, latestGame, nextGame, opponent: normalizedOpponent };
    });
  },
};

