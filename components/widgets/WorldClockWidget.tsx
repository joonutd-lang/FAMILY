"use client";

import * as React from "react";
import { useFamilyHubStore } from "@/store/familyHubStore";
import { CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Clock } from "lucide-react";
import { useInterval } from "@/lib/hooks/useInterval";

type ClockOpt = { id: string; label: string; timeZone: string };

const CLOCKS: ClockOpt[] = [
  { id: "wc_korea", label: "Korea (Seoul)", timeZone: "Asia/Seoul" },
  { id: "wc_michigan", label: "Michigan (Detroit)", timeZone: "America/Detroit" },
  { id: "wc_california", label: "California (LA)", timeZone: "America/Los_Angeles" },
];

function formatInTZ(date: Date, timeZone: string) {
  const timeFmt = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit", timeZone });
  const dateFmt = new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric", timeZone });
  return { time: timeFmt.format(date), date: dateFmt.format(date) };
}

export function WorldClockWidget({ compactMode }: { compactMode: boolean }) {
  const worldClockIds = useFamilyHubStore((s) => s.worldClockIds);
  const enabled = worldClockIds.length > 0 ? new Set(worldClockIds) : new Set(CLOCKS.map((c) => c.id));

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
            <Clock className="h-4 w-4 text-black/60 dark:text-white/60" />
            <div className="text-sm font-semibold">World Clock</div>
          </div>
          <div className="mt-1 text-xs text-black/60 dark:text-white/60">Korea, Michigan, California (configurable).</div>
        </div>
        <Badge variant="default">{enabled.size} zones</Badge>
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
                  ? "border-foreground/40 bg-white/90 dark:bg-black/10"
                  : "border-black/10 bg-white/60 dark:bg-black/30"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{c.label}</div>
                  <div className="mt-1 text-xs text-black/60 dark:text-white/60">{date}</div>
                </div>
                {isLocal ? <Badge variant="info">Local</Badge> : null}
              </div>
              <div className="mt-3 text-2xl font-semibold tracking-tight">{time}</div>
              <div className="mt-1 text-xs text-black/60 dark:text-white/60">{c.timeZone}</div>
            </div>
          );
        })}
      </div>
    </CardContent>
  );
}

