"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { teslaService } from "@/lib/services/teslaService";
import { CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { BatteryCharging, Zap } from "lucide-react";

export function TeslaWidget() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["tesla:status"],
    queryFn: () => teslaService.getTeslaStatus(),
    staleTime: 20_000,
    refetchOnWindowFocus: false,
  });

  const charging = data?.charging ?? false;
  const battery = data?.batteryPercent ?? 0;

  return (
    <CardContent className="h-full">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-black/60 dark:text-white/60" />
            <div className="text-sm font-semibold">Tesla Status</div>
          </div>
          <div className="mt-1 text-xs text-black/60 dark:text-white/60">Battery, charging, and estimated range (mock).</div>
        </div>
        <Button variant="ghost" className="rounded-full" onClick={() => refetch()} disabled={isLoading}>
          Refresh
        </Button>
      </div>

      <Separator className="my-3" />

      <div className="rounded-2xl border border-black/10 bg-white/60 p-3 dark:bg-black/30">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs text-black/60 dark:text-white/60">Battery</div>
            <div className="mt-1 text-3xl font-semibold tracking-tight">{isLoading ? "—" : `${battery}%`}</div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
              <div
                className={`h-full rounded-full ${charging ? "bg-emerald-500" : "bg-sky-500"}`}
                style={{ width: `${battery}%` }}
              />
            </div>
          </div>
          {charging ? <Badge variant="success" className="gap-1"><BatteryCharging className="h-3.5 w-3.5" /> Charging</Badge> : <Badge>Not charging</Badge>}
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <div>
            <div className="text-xs text-black/60 dark:text-white/60">Range</div>
            <div className="mt-1 text-lg font-semibold">{isLoading ? "—" : `${data?.rangeMiles ?? 0} mi`}</div>
          </div>
          <div className="text-xs text-black/60 dark:text-white/60 text-right">
            Updated {data ? new Date(data.updatedAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }) : "—"}
          </div>
        </div>
      </div>
    </CardContent>
  );
}

