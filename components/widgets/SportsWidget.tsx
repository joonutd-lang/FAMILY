"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { sportsService } from "@/lib/services/sportsService";
import { useFamilyHubStore } from "@/store/familyHubStore";
import type { SportsGame, SportsTeam } from "@/types/familyHub";
import { CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge as UiBadge } from "@/components/ui/badge";
import { formatTimeShort } from "@/lib/utils/time";
import { Star, Ticket, Plus, Minus } from "lucide-react";

function teamScore(game: SportsGame, teamId: string) {
  if (game.homeTeamId === teamId) return game.homeScore ?? 0;
  if (game.awayTeamId === teamId) return game.awayScore ?? 0;
  return 0;
}

function opponentFromGame(game: SportsGame, teamId: string, teamsById: Map<string, SportsTeam>) {
  const opponentId = game.homeTeamId === teamId ? game.awayTeamId : game.homeTeamId;
  return teamsById.get(opponentId);
}

export function SportsWidget() {
  const favoriteTeamIds = useFamilyHubStore((s) => s.favoriteSportsTeamIds);
  const setFavoriteTeamIds = useFamilyHubStore((s) => s.setFavoriteSportsTeamIds);

  const [pickerQ, setPickerQ] = React.useState("");

  const { data: allTeams } = useQuery({
    queryKey: ["sports:allTeamsForWidget"],
    queryFn: () => sportsService.getAllTeams(),
    staleTime: 10 * 60_000,
  });

  const selectedTeamIds = favoriteTeamIds;
  const { data: widgetData, isLoading, refetch } = useQuery({
    queryKey: ["sports:widgetData", selectedTeamIds.join(",")],
    queryFn: () => sportsService.getTeamsWidgetData(selectedTeamIds),
    enabled: selectedTeamIds.length > 0,
    staleTime: 30_000,
  });

  const teamsById = React.useMemo(() => new Map((allTeams ?? []).map((t) => [t.id, t])), [allTeams]);

  const pickerTeams = React.useMemo(() => {
    const teams = allTeams ?? [];
    const q = pickerQ.trim().toLowerCase();
    const filtered = !q
      ? teams
      : teams.filter((t) => t.name.toLowerCase().includes(q) || t.abbreviation.toLowerCase().includes(q));
    return filtered.slice(0, 8);
  }, [allTeams, pickerQ]);

  const toggleTeamId = (id: string) => {
    const set = new Set(favoriteTeamIds);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    setFavoriteTeamIds(Array.from(set));
  };

  const TeamEmblem = ({ team }: { team: SportsTeam }) => {
    if (team.logoUrl) {
      return (
        <img
          src={team.logoUrl}
          alt={team.abbreviation}
          className="h-9 w-9 rounded-xl border border-black/20 bg-white/95 p-1 object-contain dark:border-white/20 dark:bg-black/45"
          loading="lazy"
        />
      );
    }
    return (
      <div
        className="h-9 w-9 rounded-xl border border-black/20 bg-white/95 dark:border-white/20 dark:bg-black/45"
        style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <div className="h-5 w-5 rounded-full" style={{ background: team.color }} />
      </div>
    );
  };

  return (
    <CardContent className="h-full">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-black/80 dark:text-white/85" />
            <div className="text-sm font-semibold">Sports</div>
          </div>
          <div className="mt-1 text-xs text-black/80 dark:text-white/85">Pick favorite teams. Scores + next games.</div>
        </div>
        <Button variant="ghost" className="rounded-full" onClick={() => refetch()} disabled={selectedTeamIds.length === 0}>
          Refresh
        </Button>
      </div>

      <div className="mt-3 rounded-2xl border border-black/20 bg-white/95 p-3 dark:bg-black/55">
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs font-medium text-black/80 dark:text-white/85">Favorite teams</div>
          <Badge variant="info">Multiple</Badge>
        </div>

        {favoriteTeamIds.length === 0 ? (
          <div className="mt-3 text-sm text-black/80 dark:text-white/85">
            아래에서 팀을 `Add`로 추가하면 점수/다음 경기가 보여요.
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {(widgetData ?? []).map((item) => {
              const team = item.team;
              const latest = item.latestGame;
              const next = item.nextGame;
              const latestTeamScore = teamScore(latest, team.id);
              const opponent = item.opponent;
              const nextAt = new Date(next.startAt);
              return (
                <div key={team.id} className="rounded-2xl border border-black/20 bg-white/95 p-3 dark:bg-black/45">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <TeamEmblem team={team} />
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold">{team.abbreviation}</div>
                          <div className="text-xs text-black/80 dark:text-white/85">{team.league}</div>
                        </div>
                      </div>
                      <div className="mt-2 text-sm">
                        <span className="font-semibold">{latestTeamScore}</span>{" "}
                        <span className="text-black/80 dark:text-white/85">final</span>
                      </div>
                    </div>
                    <UiBadge variant="default" className="bg-black/5 dark:bg-white/15">
                      Next
                    </UiBadge>
                  </div>

                  <div className="mt-3 rounded-xl bg-white/95 p-2 dark:bg-black/45">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                        <div className="truncate text-xs text-black/80 dark:text-white/85">
                            vs {opponent?.abbreviation ?? "Opponent"}
                          </div>
                        </div>
                        <div className="truncate text-sm font-medium">
                          {formatTimeShort(nextAt)} • {next.venue ?? "Game"}
                        </div>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="rounded-full"
                        onClick={() => window.open("https://www.stubhub.com/", "_blank", "noopener,noreferrer")}
                        aria-label={`Buy tickets for ${team.name}`}
                      >
                        <Ticket className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-3 flex items-center gap-2">
          <Input
            value={pickerQ}
            onChange={(e) => setPickerQ(e.target.value)}
            placeholder="Search teams (e.g. Warriors, Lakers)"
          />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          {(pickerTeams ?? []).map((t) => {
            const on = favoriteTeamIds.includes(t.id);
            return (
              <div
                key={t.id}
                className={`flex items-center justify-between gap-3 rounded-2xl border px-3 py-2 text-left ${
                  on ? "border-black/20 bg-white/90" : "border-black/20 bg-white/95 hover:bg-white/90"
                } dark:hover:bg-black/55`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg border border-black/20 bg-white/95 p-1 dark:border-white/20 dark:bg-black/45">
                      {t.logoUrl ? (
                        <img src={t.logoUrl} alt={t.abbreviation} className="h-full w-full rounded-[5px] object-contain" loading="lazy" />
                      ) : (
                        <div className="h-4 w-4 rounded-full" style={{ background: t.color }} />
                      )}
                    </div>
                    <div className="truncate text-xs font-semibold">{t.abbreviation}</div>
                  </div>
                  <div className="truncate text-[11px] text-black/80 dark:text-white/85">{t.name}</div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant={on ? "secondary" : "default"}
                  className="rounded-full"
                  onClick={() => toggleTeamId(t.id)}
                  aria-label={on ? `Remove ${t.name}` : `Add ${t.name}`}
                >
                  {on ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  <span>{on ? "Remove" : "Add"}</span>
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </CardContent>
  );
}

