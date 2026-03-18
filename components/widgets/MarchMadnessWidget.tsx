"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { marchMadnessService } from "@/lib/services/marchMadnessService";
import type { MarchMadnessGame, MarchMadnessStatus } from "@/types/familyHub";
import { CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Clock, Flame, Trophy, Sparkles } from "lucide-react";
import { formatCountdown, formatTimeShort } from "@/lib/utils/time";
import { useInterval } from "@/lib/hooks/useInterval";

function isoDateInputValue(d: Date) {
  return d.toISOString().slice(0, 10);
}

function statusBadgeVariant(status: MarchMadnessStatus) {
  switch (status) {
    case "live":
      return "success";
    case "final":
      return "warning";
    default:
      return "info";
  }
}

export function MarchMadnessWidget() {
  const [selectedDateIso, setSelectedDateIso] = React.useState<string>(() => isoDateInputValue(new Date()));
  const [statusFilter, setStatusFilter] = React.useState<"all" | MarchMadnessStatus>("all");
  const [nowMs, setNowMs] = React.useState<number>(0);

  const selectedDate = React.useMemo(() => new Date(`${selectedDateIso}T00:00:00`), [selectedDateIso]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["marchMadness:scoreboard", selectedDateIso],
    queryFn: () => marchMadnessService.getScoreboardForDate({ date: selectedDate }),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  React.useEffect(() => {
    setNowMs(Date.now());
  }, []);

  useInterval(() => {
    setNowMs(Date.now());
  }, 30_000);

  const games = (data ?? []) as MarchMadnessGame[];

  const filtered = React.useMemo(() => {
    if (statusFilter === "all") return games;
    return games.filter((g) => g.status === statusFilter);
  }, [games, statusFilter]);

  const top = filtered.slice(0, 6);

  return (
    <CardContent className="h-full">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-black/60 dark:text-white/60" />
            <div className="text-sm font-semibold">March Madness</div>
            <Badge variant="info" className="rounded-full">
              ESPN
            </Badge>
          </div>
          <div className="mt-1 text-xs text-black/60 dark:text-white/60">
            Scores + schedules (NCAA men’s).
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            className="rounded-full"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            Refresh
          </Button>
          <Link href="/march-madness" className="inline-flex">
            <Button className="rounded-full" disabled={isLoading}>
              Open
            </Button>
          </Link>
        </div>
      </div>

      <Separator className="my-3" />

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl border border-black/10 bg-white/60 p-2 dark:bg-black/30">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-black/60 dark:text-white/60" />
              <div className="text-xs font-semibold text-black/60 dark:text-white/60">Date</div>
            </div>
            <div className="text-xs text-black/60 dark:text-white/60">{selectedDateIso}</div>
          </div>
          <div className="mt-2">
            <Input
              type="date"
              value={selectedDateIso}
              onChange={(e) => setSelectedDateIso(e.target.value)}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white/60 p-2 dark:bg-black/30">
          <div className="text-xs font-semibold text-black/60 dark:text-white/60">Filter</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {(["all", "live", "scheduled", "final"] as const).map((k) => {
              const isOn = statusFilter === k;
              return (
                <Button
                  key={k}
                  size="sm"
                  variant={isOn ? "default" : "ghost"}
                  className="rounded-full h-8"
                  onClick={() => setStatusFilter(k)}
                >
                  {k === "all" ? "All" : k === "live" ? (
                    <span className="inline-flex items-center gap-1">
                      <Flame className="h-3.5 w-3.5" />
                      Live
                    </span>
                  ) : k === "final" ? (
                    "Final"
                  ) : (
                    "Soon"
                  )}
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      <Separator className="my-3" />

      <div className="space-y-2 overflow-auto pr-1" style={{ maxHeight: 240 }}>
        {isLoading ? (
          <div className="text-sm text-black/60 dark:text-white/60">Loading…</div>
        ) : top.length === 0 ? (
          <div className="text-sm text-black/60 dark:text-white/60">No games for this filter.</div>
        ) : (
          top.map((g) => {
            const start = new Date(g.startAt);
            const countdown = nowMs ? formatCountdown(start.getTime() - nowMs) : "—";
            return (
              <button
                key={g.id}
                className="w-full rounded-2xl border border-black/10 bg-white/70 p-3 text-left hover:bg-white/90 dark:bg-black/20 dark:hover:bg-black/10"
                onClick={() => window.open(g.externalUrl ?? "https://www.espn.com/", "_blank", "noopener,noreferrer")}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={statusBadgeVariant(g.status)} className="rounded-full">
                        {g.status === "live" ? "Live" : g.status === "final" ? "Final" : "Scheduled"}
                      </Badge>
                      <div className="truncate text-sm font-semibold">
                        {g.homeTeam.abbreviation ?? g.homeTeam.name} vs {g.awayTeam.abbreviation ?? g.awayTeam.name}
                      </div>
                    </div>
                    <div className="mt-1 text-xs text-black/60 dark:text-white/60">
                      {g.status === "final" || g.status === "live" ? (
                        <span className="font-semibold">
                          {g.homeScore ?? "—"} - {g.awayScore ?? "—"}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2">
                          <Sparkles className="h-3.5 w-3.5" />
                          {formatTimeShort(start)} • {countdown}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </CardContent>
  );
}

