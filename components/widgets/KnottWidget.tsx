"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { knottsService } from "@/lib/services/knottsService";
import { CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateShort } from "@/lib/utils/time";
import { Separator } from "@/components/ui/separator";
import { MapPin, CalendarClock } from "lucide-react";

export function KnottWidget() {
  const [now, setNow] = React.useState(() => new Date());
  React.useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(t);
  }, []);

  const dateIso = now.toISOString().slice(0, 10);

  const { data, isLoading, error } = useQuery({
    queryKey: ["knotts:hours", dateIso],
    queryFn: () => knottsService.getHoursForDate(now),
    staleTime: 30 * 60_000,
  });

  const open = data?.open ?? false;

  return (
    <CardContent className="h-full">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-black/60 dark:text-white/85" />
            <div className="text-sm font-semibold">Knott’s Berry Farm</div>
          </div>
          <div className="mt-1 text-xs text-black/60 dark:text-white/85">Hours for today.</div>
        </div>
        {isLoading ? <Badge>Loading…</Badge> : <Badge variant={open ? "success" : "danger"}>{open ? "Open" : "Closed"}</Badge>}
      </div>

      <Separator className="my-3" />

      <div className="rounded-2xl border border-black/10 bg-white/60 p-3 dark:bg-black/55">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-black/60 dark:text-white/85" />
          <div className="text-sm font-medium">{data?.parkName ?? "Knott’s Berry Farm"}</div>
        </div>
        <div className="mt-2 text-sm font-semibold">{formatDateShort(now)}</div>
        <div className="mt-2 text-sm text-black/70 dark:text-white/85">{data?.hoursText ?? "—"}</div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <Button
          variant="outline"
          className="rounded-full"
          onClick={() => window.open("https://www.knotts.com/", "_blank", "noopener,noreferrer")}
        >
          Plan your visit
        </Button>
        {error ? <div className="text-xs text-red-600">Could not load hours.</div> : null}
      </div>
    </CardContent>
  );
}

