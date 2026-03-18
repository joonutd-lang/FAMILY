"use client";

import * as React from "react";
import { GridLayout, useContainerWidth, type Layout } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { useFamilyHubStore } from "@/store/familyHubStore";
import type { WidgetKey } from "@/types/familyHub";
import type { WidgetLayoutItem } from "@/types/layout";
import { WidgetShell } from "./WidgetShell";

const ORDER: WidgetKey[] = [
  "spacex",
  "sports",
  "schedule",
  "screenshotToSchedule",
  "messages",
  "quickLinks",
  "knott",
  "weather",
  "worldClock",
  "news",
  "tesla",
];

export default function WidgetGrid({
  renderWidget,
}: {
  renderWidget: (key: WidgetKey) => React.ReactNode;
}) {
  const widgets = useFamilyHubStore((s) => s.widgets);
  const widgetLayouts = useFamilyHubStore((s) => s.widgetLayouts);
  const compactMode = useFamilyHubStore((s) => s.compactMode);
  const setWidgetLayouts = useFamilyHubStore((s) => s.setWidgetLayouts);

  const visibleWidgetKeys = ORDER.filter((k) => widgets[k]?.visible === "visible");
  const layout = visibleWidgetKeys
    .map((k) => widgetLayouts[k])
    .filter(Boolean)
    .map((it) => ({ ...it }));

  const cols = 12;
  const rowHeight = compactMode ? 70 : 110;
  const margin: readonly [number, number] = compactMode ? [12, 12] : [16, 16];
  const containerPadding: readonly [number, number] = [0, 0];
  const { width, containerRef, mounted } = useContainerWidth({
    initialWidth: 1200,
    measureBeforeMount: false,
  });

  return (
    <div ref={containerRef} className="familyhub-grid">
      {mounted ? (
        <GridLayout
          width={width}
          className="familyhub-grid"
          gridConfig={{
            cols,
            rowHeight,
            margin,
            containerPadding,
            maxRows: 200,
          }}
          layout={layout as unknown as Layout}
          dragConfig={{
            enabled: true,
            bounded: false,
            handle: ".widget-drag-handle",
            cancel: "button, input, textarea, select, [data-no-drag='true']",
            threshold: 3,
          }}
          resizeConfig={{ enabled: true }}
          onLayoutChange={(nextLayout) => {
            const mapped: WidgetLayoutItem[] = nextLayout.map((it) => ({
              i: it.i,
              x: it.x,
              y: it.y,
              w: it.w,
              h: it.h,
              minW: it.minW,
              minH: it.minH,
              maxW: it.maxW,
              maxH: it.maxH,
            }));
            setWidgetLayouts(mapped);
          }}
        >
          {visibleWidgetKeys.map((key) => (
            <div key={key} id={`widget-${key}`} className="px-1">
              <WidgetShell widgetKey={key} title={widgets[key].title}>
                {renderWidget(key)}
              </WidgetShell>
            </div>
          ))}
        </GridLayout>
      ) : null}
    </div>
  );
}

