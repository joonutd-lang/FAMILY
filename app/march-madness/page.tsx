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
import { Clock, Flame, Trophy } from "lucide-react";
import { formatCountdown, formatTimeShort } from "@/lib/utils/time";
import { useInterval } from "@/lib/hooks/useInterval";

function isoDateInputValue(d: Date) {
  return d.toISOString().slice(0, 10);
}

function statusBadge(status: MarchMadnessStatus) {
  if (status === "live") return { variant: "success" as const, label: "Live" };
  if (status === "final") return { variant: "warning" as const, label: "Final" };
  return { variant: "info" as const, label: "Soon" };
}

export default function MarchMadnessPage() {
  const [selectedDateIso, setSelectedDateIso] = React.useState<string>(() => isoDateInputValue(new Date()));
  const [statusFilter, setStatusFilter] = React.useState<"all" | MarchMadnessStatus>("all");
  const [nowMs, setNowMs] = React.useState<number>(0);

  const selectedDate = React.useMemo(() => new Date(`${selectedDateIso}T00:00:00`), [selectedDateIso]);

  React.useEffect(() => {
    setNowMs(Date.now());
  }, []);

  useInterval(() => {
    setNowMs(Date.now());
  }, 30_000);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["marchMadness:scoreboard", selectedDateIso],
    queryFn: () => marchMadnessService.getScoreboardForDate({ date: selectedDate }),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const games = (data ?? []) as MarchMadnessGame[];

  const filtered = React.useMemo(() => {
    if (statusFilter === "all") return games;
    return games.filter((g) => g.status === statusFilter);
  }, [games, statusFilter]);

  const counts = React.useMemo(() => {
    const live = games.filter((g) => g.status === "live").length;
    const final = games.filter((g) => g.status === "final").length;
    const scheduled = games.filter((g) => g.status === "scheduled").length;
    return { live, final, scheduled };
  }, [games]);

  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 py-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-black/60 dark:text-white/60" />
          <div>
            <div className="text-lg font-semibold">March Madness</div>
            <div className="text-xs text-black/60 dark:text-white/60">
              ESPN scoreboard for NCAA men’s.
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/">
            <Button variant="outline" className="rounded-full">
              Back to dashboard
            </Button>
          </Link>
          <Button className="rounded-full" variant="ghost" disabled={isLoading} onClick={() => refetch()}>
            Refresh
          </Button>
        </div>
      </div>

      <Separator className="my-4" />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-black/10 bg-white/95 p-3 dark:bg-black/30">
          <div className="text-xs font-semibold text-black/60 dark:text-white/60">Date</div>
          <div className="mt-2 flex items-center gap-2">
            <Clock className="h-4 w-4 text-black/60 dark:text-white/60" />
            <div className="text-sm text-black/70 dark:text-white/70">{selectedDateIso}</div>
          </div>
          <div className="mt-2">
            <Input type="date" value={selectedDateIso} onChange={(e) => setSelectedDateIso(e.target.value)} />
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white/95 p-3 dark:bg-black/30">
          <div className="text-xs font-semibold text-black/60 dark:text-white/60">Status</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {(["all", "live", "scheduled", "final"] as const).map((k) => {
              const isOn = statusFilter === k;
              const display =
                k === "all" ? "All" : k === "live" ? "Live" : k === "final" ? "Final" : "Soon";
              return (
                <Button
                  key={k}
                  size="sm"
                  variant={isOn ? "default" : "ghost"}
                  className="rounded-full h-8"
                  onClick={() => setStatusFilter(k)}
                >
                  {k === "live" ? <span className="inline-flex items-center gap-1"><Flame className="h-3.5 w-3.5" />{display}</span> : display}
                </Button>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white/95 p-3 dark:bg-black/30">
          <div className="text-xs font-semibold text-black/60 dark:text-white/60">Totals</div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="text-xs text-black/60 dark:text-white/60">Live</div>
            <Badge variant="success" className="rounded-full">{counts.live}</Badge>
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="text-xs text-black/60 dark:text-white/60">Final</div>
            <Badge variant="warning" className="rounded-full">{counts.final}</Badge>
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="text-xs text-black/60 dark:text-white/60">Soon</div>
            <Badge variant="info" className="rounded-full">{counts.scheduled}</Badge>
          </div>
        </div>
      </div>

      <Separator className="my-4" />

      <CardContent className="p-0 h-auto">
        <div className="space-y-2">
          {isLoading ? (
            <div className="text-sm text-black/60 dark:text-white/60">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="text-sm text-black/60 dark:text-white/60">No games for this filter.</div>
          ) : (
            filtered.slice(0, 40).map((g) => {
              const start = new Date(g.startAt);
              const b = statusBadge(g.status);
              const countdown = nowMs ? formatCountdown(start.getTime() - nowMs) : "—";
              return (
                <button
                  key={g.id}
                  className="w-full rounded-2xl border border-black/10 bg-white/95 p-3 text-left hover:bg-white dark:bg-black/20 dark:hover:bg-black/10"
                  onClick={() => window.open(g.externalUrl ?? "https://www.espn.com/", "_blank", "noopener,noreferrer")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={b.variant} className="rounded-full">{b.label}</Badge>
                        <div className="truncate text-sm font-semibold">
                          {g.homeTeam.name} vs {g.awayTeam.name}
                        </div>
                      </div>
                      <div className="mt-1 text-xs text-black/60 dark:text-white/60">
                        {g.status === "final" || g.status === "live" ? (
                          <span className="font-semibold">
                            {g.homeScore ?? "—"} - {g.awayScore ?? "—"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2">
                            {formatTimeShort(start)} • {countdown}
                          </span>
                        )}
                        {g.venue ? <span className="ml-2 truncate">• {g.venue}</span> : null}
                      </div>
                    </div>
                    <div className="text-xs text-black/60 dark:text-white/60">
                      {formatTimeShort(start)}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </CardContent>
    </div>
  );
}

