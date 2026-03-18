"use client";

import * as React from "react";
import { useFamilyHubStore } from "@/store/familyHubStore";
import WidgetGrid from "@/components/widgets/WidgetGrid";
import { FamilyHeader } from "./FamilyHeader";
import { SettingsDrawer } from "./SettingsDrawer";
import { useInterval } from "@/lib/hooks/useInterval";
import { formatDateTimeShort } from "@/lib/utils/time";
import type { WidgetKey } from "@/types/familyHub";

import { SpaceXLaunchWidget } from "@/components/widgets/SpaceXLaunchWidget";
import { SportsWidget } from "@/components/widgets/SportsWidget";
import { MarchMadnessWidget } from "@/components/widgets/MarchMadnessWidget";
import { FamilyScheduleWidget } from "@/components/widgets/FamilyScheduleWidget";
import { ScreenshotToScheduleWidget } from "@/components/widgets/ScreenshotToScheduleWidget";
import { FamilyMessageBoardWidget } from "@/components/widgets/FamilyMessageBoardWidget";
import { QuickLinksWidget } from "@/components/widgets/QuickLinksWidget";
import { KnottWidget } from "@/components/widgets/KnottWidget";
import { WeatherWidget } from "@/components/widgets/WeatherWidget";
import { WorldClockWidget } from "@/components/widgets/WorldClockWidget";
import { NewsWidget } from "@/components/widgets/NewsWidget";
import { TeslaWidget } from "@/components/widgets/TeslaWidget";

function getTimeLabel(d: Date) {
  return `${formatDateTimeShort(d)}`;
}

export default function FamilyHubDashboard() {
  const theme = useFamilyHubStore((s) => s.theme);
  const compactMode = useFamilyHubStore((s) => s.compactMode);

  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [now, setNow] = React.useState(() => new Date());

  useInterval(() => setNow(new Date()), 1000);

  React.useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, [theme]);

  const renderWidget = React.useCallback((key: WidgetKey) => {
    switch (key) {
      case "spacex":
        return <SpaceXLaunchWidget />;
      case "sports":
        return <SportsWidget />;
      case "marchMadness":
        return <MarchMadnessWidget />;
      case "schedule":
        return <FamilyScheduleWidget />;
      case "screenshotToSchedule":
        return <ScreenshotToScheduleWidget />;
      case "messages":
        return <FamilyMessageBoardWidget />;
      case "quickLinks":
        return <QuickLinksWidget />;
      case "knott":
        return <KnottWidget />;
      case "weather":
        return <WeatherWidget />;
      case "worldClock":
        return <WorldClockWidget compactMode={compactMode} />;
      case "news":
        return <NewsWidget />;
      case "tesla":
        return <TeslaWidget />;
      default:
        return null;
    }
  }, [compactMode]);

  return (
    <div className="flex flex-1 flex-col">
      <FamilyHeader currentTimeLabel={getTimeLabel(now)} onOpenSettings={() => setSettingsOpen(true)} />
      <main className="flex flex-1 justify-center px-2 py-3">
        <div className="w-full max-w-[1400px]">
          <WidgetGrid renderWidget={renderWidget} />
        </div>
      </main>
      <SettingsDrawer open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}

