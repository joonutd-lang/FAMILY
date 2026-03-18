import type { KnottsParkHours } from "@/types/knotts";

export const knottsService = {
  async getHoursForDate(date: Date): Promise<KnottsParkHours> {
    const dateIso = date.toISOString().slice(0, 10);

    const res = await fetch(`/api/knotts-park-hours?date=${encodeURIComponent(dateIso)}`, {
      method: "GET",
    });

    if (!res.ok) {
      throw new Error(`Knott hours request failed: ${res.status}`);
    }

    return (await res.json()) as KnottsParkHours;
  },
};

