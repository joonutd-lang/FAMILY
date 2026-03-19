"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { spacexService } from "@/lib/services/spacexService";
import { useInterval } from "@/lib/hooks/useInterval";
import { CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCountdown } from "@/lib/utils/time";
import type { LaunchEvent } from "@/types/familyHub";
import { Globe, Rocket, MapPin } from "lucide-react";

function statusVariant(status: LaunchEvent["status"]) {
  switch (status) {
    case "success":
      return "success";
    case "failed":
      return "danger";
    case "in_progress":
      return "info";
    default:
      return "default";
  }
}

export function SpaceXLaunchWidget() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["spacex:nextLaunch"],
    queryFn: () => spacexService.getNextLaunch(),
    refetchOnWindowFocus: false,
    staleTime: 60_000,
  });

  const [now, setNow] = React.useState(() => Date.now());
  useInterval(() => setNow(Date.now()), 1000);

  const launch = data;
  const netAt = launch ? new Date(launch.netTime) : null;
  const isCaliforniaRelevant = launch ? /ca|california|vandenberg/i.test(launch.launchSite) : false;

  return (
    <>
      <CardContent className="h-full">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Rocket className="h-4 w-4 text-black/80 dark:text-white/85" />
              <div className="truncate text-sm font-semibold">Next launch</div>
            </div>
            <div className="mt-1 truncate text-base font-semibold">
              {isLoading ? "Loading…" : launch?.missionName ?? "No launch found"}
            </div>
          </div>
          {launch ? <Badge variant={statusVariant(launch.status)}>{launch.status.replace("_", " ")}</Badge> : null}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-2xl border border-black/20 bg-white/95 p-3 dark:bg-black/55">
            <div className="text-xs text-black/80 dark:text-white/85">Countdown</div>
            <div className="mt-1 text-lg font-semibold">{launch && netAt ? formatCountdown(netAt.getTime() - now) : "—"}</div>
          </div>
          <div className="rounded-2xl border border-black/20 bg-white/95 p-3 dark:bg-black/55">
            <div className="text-xs text-black/80 dark:text-white/85">NET (local)</div>
            <div className="mt-1 text-lg font-semibold">{netAt ? netAt.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }) : "—"}</div>
          </div>
        </div>

        <div className="mt-3 rounded-2xl border border-black/20 bg-white/95 p-3 dark:bg-black/55">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-black/80 dark:text-white/85" />
            <div className="text-sm font-medium truncate">{launch?.launchSite ?? "—"}</div>
          </div>
          {isCaliforniaRelevant ? (
            <div className="mt-1 text-xs text-black/80 dark:text-white/85 flex items-center gap-2">
              <Globe className="h-3.5 w-3.5" />
              Local viewing: California time is especially relevant here.
            </div>
          ) : (
            <div className="mt-1 text-xs text-black/80 dark:text-white/85">Try World Clock for your local times.</div>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <Button
            variant="outline"
            className="rounded-full"
            disabled={!launch?.externalUrl}
            onClick={() => {
              if (launch?.externalUrl) window.open(launch.externalUrl, "_blank", "noopener,noreferrer");
            }}
          >
            View details
          </Button>
          <Button variant="ghost" className="rounded-full" onClick={() => refetch()} disabled={isLoading}>
            Refresh
          </Button>
        </div>

        {error ? <div className="mt-3 text-xs text-red-600">Failed to load SpaceX data.</div> : null}
      </CardContent>
    </>
  );
}

