import type { TeslaStatus } from "@/types/familyHub";
import { mockDelay } from "./mockDelay";
import { seedTesla, seedTeslaByVehicleId } from "@/data/seed";

function hashStringToUnit(s: string) {
  // Deterministic 0..1 from vehicle id (no crypto, just enough for mock variability).
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // Convert to 0..1
  return ((h >>> 0) % 1000) / 1000;
}

export const teslaService = {
  async getTeslaStatuses(params: { vehicleIds: string[] }): Promise<Array<{ vehicleId: string; status: TeslaStatus }>> {
    await mockDelay(450);
    const now = Date.now();

    return params.vehicleIds.map((vehicleId) => {
      const base = seedTeslaByVehicleId[vehicleId] ?? seedTesla;
      const seed = hashStringToUnit(vehicleId);
      const drift = ((now / (1000 * 60)) % 60) / 60; // varies over minutes, 0..1
      const drift2 = (drift * 0.75 + seed * 0.25) % 1; // mix vehicle-specific seed

      const batteryDelta = Math.round((drift2 - 0.5) * 6); // -3..3
      const rangeDelta = Math.round(batteryDelta * 2.4);
      const charging = drift2 < 0.2 || drift2 > 0.85;

      return {
        vehicleId,
        status: {
          ...base,
          charging,
          batteryPercent: Math.max(0, Math.min(100, base.batteryPercent + batteryDelta + (charging ? 2 : 0))),
          rangeMiles: Math.max(0, base.rangeMiles + rangeDelta + (charging ? 8 : 0)),
          updatedAt: new Date().toISOString(),
        },
      };
    });
  },
};

