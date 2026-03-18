import type { LaunchEvent } from "@/types/familyHub";
import { seedLaunch } from "@/data/seed";
import { mockDelay } from "./mockDelay";

function withSlightVariance(ev: LaunchEvent): LaunchEvent {
  // Small deterministic-ish shift to keep the countdown feeling alive.
  const shiftMin = (Date.now() % (1000 * 60 * 30)) / 60; // 0..30
  return {
    ...ev,
    netTime: new Date(new Date(ev.netTime).getTime() + shiftMin * 60_000).toISOString(),
  };
}

export const spacexService = {
  async getNextLaunch(): Promise<LaunchEvent> {
    await mockDelay(600);
    return withSlightVariance(seedLaunch);
  },
};

