import type { TeslaStatus } from "@/types/familyHub";
import { mockDelay } from "./mockDelay";
import { seedTesla } from "@/data/seed";

export const teslaService = {
  async getTeslaStatus(): Promise<TeslaStatus> {
    await mockDelay(450);
    const now = Date.now();
    const drift = (now % (1000 * 60 * 60)) / (1000 * 60 * 60); // 0..1
    const batteryDelta = Math.round((drift - 0.5) * 6); // -3..3
    const rangeDelta = Math.round(batteryDelta * 2.4);
    const charging = drift < 0.2 || drift > 0.85;
    return {
      ...seedTesla,
      charging,
      batteryPercent: Math.max(0, Math.min(100, seedTesla.batteryPercent + batteryDelta + (charging ? 2 : 0))),
      rangeMiles: Math.max(0, seedTesla.rangeMiles + rangeDelta + (charging ? 8 : 0)),
      updatedAt: new Date().toISOString(),
    };
  },
};

