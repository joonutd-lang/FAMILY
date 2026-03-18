"use client";

import { motion } from "framer-motion";
import { GripVertical, EyeOff, Eye, ChevronsUpDown } from "lucide-react";
import * as React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import type { WidgetKey } from "@/types/familyHub";
import { useFamilyHubStore } from "@/store/familyHubStore";

export function WidgetShell({
  widgetKey,
  title,
  children,
  collapsedSummary,
}: {
  widgetKey: WidgetKey;
  title: string;
  children: React.ReactNode;
  collapsedSummary?: React.ReactNode;
}) {
  const activeMemberId = useFamilyHubStore((s) => s.activeMemberId);
  const widgets = useFamilyHubStore((s) => s.widgets);
  const widgetUiByMemberId = useFamilyHubStore((s) => s.widgetUiByMemberId);
  const memberUi = widgetUiByMemberId[activeMemberId]?.[widgetKey];

  const collapsed = memberUi?.collapsed ?? widgets[widgetKey]?.collapsed ?? false;
  const visible = memberUi?.visible ?? widgets[widgetKey]?.visible ?? "visible";
  const setWidgetCollapsed = useFamilyHubStore((s) => s.setWidgetCollapsed);
  const setWidgetVisible = useFamilyHubStore((s) => s.setWidgetVisible);

  if (visible === "hidden") return null;

  return (
    <Card className="h-full overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="widget-drag-handle cursor-grab rounded-full p-1 text-black/50 hover:text-black/80 dark:text-white/80 dark:hover:text-white/95">
            <GripVertical className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{title}</div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full"
            onClick={() => setWidgetCollapsed(widgetKey, !collapsed)}
            aria-label={collapsed ? "Expand widget" : "Collapse widget"}
          >
            <ChevronsUpDown className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full"
            onClick={() => setWidgetVisible(widgetKey, visible === "visible" ? "hidden" : "visible")}
            aria-label="Hide widget"
          >
            {visible === "visible" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <motion.div
        layout
        initial={false}
        className={cn("relative h-full", collapsed && "pointer-events-none")}
      >
        {collapsed ? (
          <div className="flex h-full flex-col gap-2 px-4 pb-4 pt-1">
            <div className="text-xs text-black/60 dark:text-white/80">Collapsed</div>
            <div className="text-sm font-medium">{collapsedSummary ?? null}</div>
          </div>
        ) : (
          <div className="h-[calc(100%-56px)] overflow-auto px-0 pb-4">
            {children}
          </div>
        )}
      </motion.div>
    </Card>
  );
}

