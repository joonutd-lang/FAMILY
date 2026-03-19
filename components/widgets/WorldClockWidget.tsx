"use client";

import * as React from "react";
import { useFamilyHubStore } from "@/store/familyHubStore";
import { CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Clock, Plus } from "lucide-react";
import { useInterval } from "@/lib/hooks/useInterval";
import { cn } from "@/lib/utils/cn";

type ClockOpt = { id: string; label: string; timeZone: string };

const CLOCKS: ClockOpt[] = [
  { id: "wc_korea", label: "Korea (Seoul)", timeZone: "Asia/Seoul" },
  { id: "wc_michigan", label: "Michigan (Detroit)", timeZone: "America/Detroit" },
  { id: "wc_california", label: "California (LA)", timeZone: "America/Los_Angeles" },
  { id: "wc_newyork", label: "New York (EST)", timeZone: "America/New_York" },
  { id: "wc_london", label: "London (GMT)", timeZone: "Europe/London" },
  { id: "wc_tokyo", label: "Tokyo", timeZone: "Asia/Tokyo" },
  { id: "wc_singapore", label: "Singapore", timeZone: "Asia/Singapore" },
  { id: "wc_sydney", label: "Sydney", timeZone: "Australia/Sydney" },
];

const DEFAULT_CLOCK_IDS = ["wc_korea", "wc_michigan", "wc_california"];

function formatInTZ(date: Date, timeZone: string) {
  const timeFmt = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit", timeZone });
  const dateFmt = new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric", timeZone });
  return { time: timeFmt.format(date), date: dateFmt.format(date) };
}

export function WorldClockWidget({ compactMode }: { compactMode: boolean }) {
  const worldClockIds = useFamilyHubStore((s) => s.worldClockIds);
  const setWorldClockIds = useFamilyHubStore((s) => s.setWorldClockIds);
  const enabled = worldClockIds.length > 0 ? new Set(worldClockIds) : new Set(DEFAULT_CLOCK_IDS);

  const [now, setNow] = React.useState(() => new Date());
  useInterval(() => setNow(new Date()), 30_000);

  const localTimeZone = React.useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return "";
    }
  }, []);

  return (
    <CardContent className="h-full">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-black/80 dark:text-white/85" />
            <div className="text-sm font-semibold">World Clock</div>
          </div>
          <div className="mt-1 text-xs text-black/80 dark:text-white/85">
            Default zones. Use <span className="font-semibold">Add</span> (+) to show more.
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="default">{enabled.size} zones</Badge>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn("rounded-full", enabled.size === CLOCKS.length && "opacity-60")}
            onClick={() => {
              const disabled = CLOCKS.map((c) => c.id).filter((id) => !enabled.has(id));
              if (disabled.length === 0) return;
              const current = worldClockIds.length > 0 ? worldClockIds : Array.from(DEFAULT_CLOCK_IDS);
              const next = Array.from(new Set([...current, disabled[0]]));
              setWorldClockIds(next);
            }}
            disabled={enabled.size === CLOCKS.length}
            aria-label="Add another time zone"
          >
            <Plus className="h-4 w-4" />
            <span className="text-xs font-semibold">Add</span>
          </Button>
        </div>
      </div>

      <Separator className="my-3" />

      <div className={`grid grid-cols-1 gap-2 ${compactMode ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
        {CLOCKS.filter((c) => enabled.has(c.id)).map((c) => {
          const { time, date } = formatInTZ(now, c.timeZone);
          const isLocal = localTimeZone && c.timeZone === localTimeZone;
          return (
            <div
              key={c.id}
              className={`rounded-2xl border p-3 ${
                isLocal
                  ? "border-foreground/40 bg-white/90 dark:bg-black/45"
                  : "border-black/20 bg-white/95 dark:bg-black/45"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{c.label}</div>
                  <div className="mt-1 text-xs text-black/80 dark:text-white/85">{date}</div>
                </div>
                {isLocal ? <Badge variant="info">Local</Badge> : null}
              </div>
              <div className="mt-3 text-2xl font-semibold tracking-tight">{time}</div>
              <div className="mt-1 text-xs text-black/80 dark:text-white/85">{c.timeZone}</div>
            </div>
          );
        })}
      </div>
    </CardContent>
  );
}

