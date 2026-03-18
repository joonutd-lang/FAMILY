import type { KnottsParkHours } from "@/types/knotts";
import { mockDelay } from "./mockDelay";

function formatIsoLocal(date: Date, hhmm: string) {
  const [hh, mm] = hhmm.split(":").map((x) => Number(x));
  const d = new Date(date);
  d.setHours(hh, mm, 0, 0);
  return d.toISOString();
}

export const knottsService = {
  async getHoursForDate(date: Date): Promise<KnottsParkHours> {
    await mockDelay(450);
    const day = date.getDay(); // 0 Sun
    // Mock: closed on Mondays, shorter on Tue/Thu, full on weekends.
    const open = day !== 1;

    const openTime = day === 0 || day === 6 ? "10:00" : day === 2 || day === 4 ? "11:00" : "10:30";
    const closeTime = day === 0 || day === 6 ? "20:00" : day === 2 || day === 4 ? "18:00" : "19:00";

    const openAt = open ? formatIsoLocal(date, openTime) : undefined;
    const closeAt = open ? formatIsoLocal(date, closeTime) : undefined;

    return {
      date: date.toISOString().slice(0, 10),
      open,
      parkName: "Knott's Berry Farm",
      hoursText: open ? `Open today • ${openTime} - ${closeTime}` : "Closed today",
      openAt,
      closeAt,
    };
  },
};

