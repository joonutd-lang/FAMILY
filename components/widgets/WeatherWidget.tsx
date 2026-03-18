"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { weatherService } from "@/lib/services/weatherService";
import type { WeatherStatus } from "@/types/familyHub";
import { CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Cloud, Droplets, Wind } from "lucide-react";
import { formatTimeShort } from "@/lib/utils/time";

const DEFAULT_LOCATION = {
  latitude: 34.0522,
  longitude: -118.2437,
  locationLabel: "California (LA)",
};

export function WeatherWidget() {
  const { data, isLoading, refetch, error } = useQuery({
    queryKey: ["weather:default", DEFAULT_LOCATION.latitude, DEFAULT_LOCATION.longitude],
    queryFn: () => weatherService.getWeatherForLocation(DEFAULT_LOCATION),
    staleTime: 10 * 60_000,
    refetchOnWindowFocus: false,
  });

  const wx = data as WeatherStatus | undefined;

  const updatedLabel = wx ? formatTimeShort(new Date(wx.updatedAt)) : "—";

  const precipitation = wx?.precipitationMm;
  const wind = wx?.windKph;

  return (
    <CardContent className="h-full">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Cloud className="h-4 w-4 text-black/60 dark:text-white/85" />
            <div className="truncate text-sm font-semibold">Weather</div>
          </div>
          <div className="mt-1 text-xs text-black/60 dark:text-white/85 truncate">{DEFAULT_LOCATION.locationLabel}</div>
        </div>
        <Button variant="ghost" className="rounded-full" disabled={isLoading} onClick={() => refetch()}>
          Refresh
        </Button>
      </div>

      <Separator className="my-3" />

      {error ? (
        <div className="text-sm text-red-600">Weather unavailable.</div>
      ) : (
          <div className="rounded-2xl border border-black/10 bg-white/95 p-3 dark:bg-black/55 h-full flex flex-col">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs text-black/60 dark:text-white/85">Now</div>
              <div className="mt-1 text-4xl font-semibold tracking-tight">
                {isLoading || !wx ? "—" : `${Math.round(wx.temperatureC)}°C`}
              </div>
              <div className="mt-1 text-xs text-black/60 dark:text-white/85">{wx ? wx.description : ""}</div>
            </div>
            {wx ? (
              <Badge variant="info" className="rounded-full">
                Updated {updatedLabel}
              </Badge>
            ) : null}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-2xl border border-black/10 bg-white/95 p-2 dark:bg-black/45">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Droplets className="h-3.5 w-3.5 text-black/60 dark:text-white/85" />
                  <div className="text-xs text-black/60 dark:text-white/85">Precip</div>
                </div>
                <div className="text-sm font-semibold">{precipitation === undefined ? "—" : `${precipitation} mm`}</div>
              </div>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white/95 p-2 dark:bg-black/45">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Wind className="h-3.5 w-3.5 text-black/60 dark:text-white/85" />
                  <div className="text-xs text-black/60 dark:text-white/85">Wind</div>
                </div>
                <div className="text-sm font-semibold">{wind === undefined ? "—" : `${wind} kph`}</div>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-3 text-xs text-black/60 dark:text-white/85">
            Tip: Settings에서 World Clock을 가족 시간대에 맞춰 보세요.
          </div>
        </div>
      )}
    </CardContent>
  );
}

