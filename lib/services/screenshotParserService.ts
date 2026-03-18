import type { ParsedEvent } from "@/types/familyHub";
import { mockDelay } from "./mockDelay";

function guessTimeFromFileName(fileName: string) {
  const lower = fileName.toLowerCase();
  if (lower.includes("am")) return "08:15";
  if (lower.includes("pm")) return "17:30";
  return "18:00";
}

function guessTeamFromFileName(fileName: string) {
  const lower = fileName.toLowerCase();
  if (lower.includes("warrior") || lower.includes("gsw")) return "Warriors";
  if (lower.includes("laker") || lower.includes("lakers") || lower.includes("lal")) return "Lakers";
  if (lower.includes("patriot")) return "Patriots";
  if (lower.includes("soccer")) return "Soccer";
  return "Team";
}

export const screenshotParserService = {
  async parseScreenshot(file: File): Promise<ParsedEvent[]> {
    await mockDelay(900);
    const now = new Date();
    const extractedDate = new Date(now.getTime() + 1000 * 60 * 60 * 24).toISOString().slice(0, 10);
    const extractedTime = guessTimeFromFileName(file.name);
    const extractedTeamName = guessTeamFromFileName(file.name);

    const extracted: ParsedEvent = {
      id: `pe_${Date.now()}`,
      extractedDate,
      extractedTime,
      extractedTeamName,
      confidence: 0.72,
      notes: "Mock OCR: edit details before saving.",
    };
    return [extracted];
  },
};

