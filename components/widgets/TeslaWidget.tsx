"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { teslaService } from "@/lib/services/teslaService";
import { CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { BatteryCharging, Plus, Trash2, Car, Zap } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { TeslaStatus } from "@/types/familyHub";
import { useFamilyHubStore } from "@/store/familyHubStore";

export function TeslaWidget() {
  const teslaVehicles = useFamilyHubStore((s) => s.teslaVehicles);
  const addTeslaVehicle = useFamilyHubStore((s) => s.addTeslaVehicle);
  const removeTeslaVehicle = useFamilyHubStore((s) => s.removeTeslaVehicle);

  const [open, setOpen] = React.useState(false);
  const [nickname, setNickname] = React.useState("");
  const [vin, setVin] = React.useState("");

  const vehicleIds = teslaVehicles.map((v) => v.id);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["tesla:statuses", vehicleIds.join(",")],
    queryFn: () => teslaService.getTeslaStatuses({ vehicleIds }),
    enabled: vehicleIds.length > 0,
    staleTime: 20_000,
    refetchOnWindowFocus: false,
  });

  const statusByVehicleId = React.useMemo(() => {
    const map = new Map<string, TeslaStatus>();
    (data ?? []).forEach((row) => map.set(row.vehicleId, row.status));
    return map;
  }, [data]);

  const onAdd = () => {
    const clean = nickname.trim();
    if (!clean) return;
    addTeslaVehicle({ nickname: clean, vin: vin.trim() || undefined });
    setNickname("");
    setVin("");
    setOpen(false);
  };

  return (
    <CardContent className="h-full">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-black/60 dark:text-white/85" />
            <div className="text-sm font-semibold">Tesla Status</div>
          </div>
          <div className="mt-1 text-xs text-black/60 dark:text-white/85">Battery, charging, and estimated range (mock).</div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" className="rounded-full" onClick={() => refetch()} disabled={isLoading || vehicleIds.length === 0}>
            Refresh
          </Button>
          <Button variant="outline" className="rounded-full" size="icon" onClick={() => setOpen(true)} aria-label="Add Tesla vehicle">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Separator className="my-3" />

      {teslaVehicles.length === 0 ? (
        <div className="rounded-2xl border border-black/10 bg-white/60 p-4 dark:bg-black/55">
          <div className="text-sm font-semibold">No Tesla vehicles yet</div>
          <div className="mt-1 text-xs text-black/60 dark:text-white/85">`+`를 눌러 차량을 추가해 주세요.</div>
        </div>
      ) : (
        <div className="space-y-2">
          {teslaVehicles.map((v) => {
            const st = statusByVehicleId.get(v.id);
            const charging = st?.charging ?? false;
            const battery = st?.batteryPercent ?? 0;
            const range = st?.rangeMiles ?? 0;
            return (
                <div key={v.id} className="rounded-2xl border border-black/10 bg-white/60 p-3 dark:bg-black/55">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4 text-black/60 dark:text-white/85" />
                      <div className="truncate text-sm font-semibold">{v.nickname}</div>
                    </div>

                    <div className="mt-2">
                      <div className="text-xs text-black/60 dark:text-white/85">Battery</div>
                      <div className="mt-1 text-3xl font-semibold tracking-tight">{isLoading ? "—" : `${battery}%`}</div>
                      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                        <div
                          className={`h-full rounded-full ${charging ? "bg-emerald-500" : "bg-sky-500"}`}
                          style={{ width: `${battery}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {charging ? (
                      <Badge variant="success" className="gap-1">
                        <BatteryCharging className="h-3.5 w-3.5" /> Charging
                      </Badge>
                    ) : (
                      <Badge>Not charging</Badge>
                    )}

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-full"
                      onClick={() => removeTeslaVehicle(v.id)}
                      aria-label={`Remove ${v.nickname}`}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs text-black/60 dark:text-white/85">Range</div>
                    <div className="mt-1 text-lg font-semibold">{isLoading ? "—" : `${range} mi`}</div>
                  </div>
                  <div className="text-xs text-black/60 dark:text-white/85 text-right">
                    Updated{" "}
                    {st ? new Date(st.updatedAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }) : "—"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Tesla vehicle</DialogTitle>
            <DialogDescription>닉네임과 VIN(선택)을 입력하세요. 지금은 모의 데이터로 표시됩니다.</DialogDescription>
          </DialogHeader>

          <div className="mt-3 space-y-3">
            <div>
              <div className="text-xs font-medium text-black/60 dark:text-white/85">Nickname</div>
              <Input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="예: Home Tesla" className="mt-1" />
            </div>
            <div>
              <div className="text-xs font-medium text-black/60 dark:text-white/85">VIN (optional)</div>
              <Input value={vin} onChange={(e) => setVin(e.target.value)} placeholder="예: 5YJ..." className="mt-1" />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <Button variant="outline" className="rounded-full" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button className="rounded-full" onClick={onAdd} disabled={!nickname.trim()}>
              Add
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </CardContent>
  );
}

