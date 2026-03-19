"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useFamilyHubStore } from "@/store/familyHubStore";
import type { WidgetKey } from "@/types/familyHub";

const WIDGETS: Array<{ key: WidgetKey; desc: string }> = [
  { key: "spacex", desc: "SpaceX next launch, countdown, and local relevance" },
  { key: "sports", desc: "Favorite teams: scores and next games" },
  { key: "marchMadness", desc: "NCAA March Madness style scores (ESPN)" },
  { key: "schedule", desc: "Family schedule timeline + agenda" },
  { key: "screenshotToSchedule", desc: "Upload screenshots and save events" },
  { key: "messages", desc: "Family message board with pins" },
  { key: "quickLinks", desc: "Favorite links in one place" },
  { key: "knott", desc: "Knott’s Berry Farm hours + status" },
  { key: "weather", desc: "Local weather (mock-free, keyless provider)" },
  { key: "worldClock", desc: "Korea, Michigan, California clocks" },
  { key: "news", desc: "Top US headlines" },
  { key: "tesla", desc: "Tesla battery, charging, and range" },
];

export function WidgetManagerModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const activeMemberId = useFamilyHubStore((s) => s.activeMemberId);
  const widgets = useFamilyHubStore((s) => s.widgets);
  const widgetUiByMemberId = useFamilyHubStore((s) => s.widgetUiByMemberId);
  const setWidgetVisible = useFamilyHubStore((s) => s.setWidgetVisible);
  const setWidgetCollapsed = useFamilyHubStore((s) => s.setWidgetCollapsed);
  const resetWidgetLayoutsToDefault = useFamilyHubStore((s) => s.resetWidgetLayoutsToDefault);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Widget Manager</DialogTitle>
          <DialogDescription>Hide/show, collapse, and reset layout.</DialogDescription>
        </DialogHeader>

        <div className="mt-4 flex max-h-[65vh] flex-col gap-2 overflow-auto pr-1">
          {WIDGETS.map((w) => {
            const memberUi = widgetUiByMemberId[activeMemberId]?.[w.key];
            const visible = memberUi?.visible === "visible";
            const collapsed = memberUi?.collapsed ?? widgets[w.key]?.collapsed ?? false;
            return (
                <div key={w.key} className="rounded-2xl border border-black/10 bg-white/95 p-3 backdrop-blur dark:border-white/20 dark:bg-black/55">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{widgets[w.key]?.title ?? w.key}</div>
                    <div className="mt-1 text-xs text-black/80 dark:text-white/85">{w.desc}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-black/80 dark:text-white/85">On</span>
                      <Switch checked={visible} onCheckedChange={(v) => setWidgetVisible(w.key, v ? "visible" : "hidden")} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-black/80 dark:text-white/85">Collapsed</span>
                      <Switch
                        checked={collapsed}
                        disabled={!visible}
                        onCheckedChange={(v) => setWidgetCollapsed(w.key, v)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <Separator className="my-4" />

        <div className="flex items-center justify-between gap-3">
          <Button
            variant="outline"
            onClick={() => resetWidgetLayoutsToDefault()}
            className="rounded-full"
          >
            Reset layout
          </Button>
          <Button className="rounded-full" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

