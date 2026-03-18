import type { KnottsParkHours } from "@/types/knotts";

const KNOTTS_HOURS_URL = "https://www.sixflags.com/knotts/park-hours";

function unescapeJsonString(input: string) {
  // Basic unescape for JSON-string-escaped content we pull out of HTML via regex.
  return input
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\");
}

function parseOpenCloseFromHoursText(hoursText: string): { open: boolean } {
  const normalized = hoursText.toLowerCase();
  const open = normalized.includes("open") && !normalized.includes("closed");
  return { open };
}

function extractHoursForDateFromHtml(html: string, dateIso: string): KnottsParkHours | null {
  // Heuristic approach:
  // 1) Find the first occurrence of our dateIso in HTML
  // 2) Look near it for hoursText/openAt/closeAt keys
  const idx = html.indexOf(dateIso);
  const window = idx >= 0 ? html.slice(Math.max(0, idx - 2500), Math.min(html.length, idx + 6000)) : html;

  // Try to grab a precomputed "hoursText" string.
  const hoursTextMatch = window.match(/"hoursText"\s*:\s*"([^"]+)"/);
  const openAtMatch = window.match(/"openAt"\s*:\s*"([^"]+)"/);
  const closeAtMatch = window.match(/"closeAt"\s*:\s*"([^"]+)"/);

  if (hoursTextMatch?.[1]) {
    const hoursText = unescapeJsonString(hoursTextMatch[1]);
    const { open } = parseOpenCloseFromHoursText(hoursText);
    return {
      date: dateIso,
      open,
      parkName: "Knott's Berry Farm",
      hoursText,
      openAt: openAtMatch?.[1] ? unescapeJsonString(openAtMatch[1]) : undefined,
      closeAt: closeAtMatch?.[1] ? unescapeJsonString(closeAtMatch[1]) : undefined,
    };
  }

  // Fallback: "scheduleClosed" or similar sometimes appears without hoursText.
  // If we can at least find openAt/closeAt around the date, derive a minimal hoursText.
  if (openAtMatch?.[1] && closeAtMatch?.[1]) {
    const openAt = unescapeJsonString(openAtMatch[1]);
    const closeAt = unescapeJsonString(closeAtMatch[1]);
    return {
      date: dateIso,
      open: true,
      parkName: "Knott's Berry Farm",
      hoursText: "Open today",
      openAt,
      closeAt,
    };
  }

  return null;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const dateIso = url.searchParams.get("date") || new Date().toISOString().slice(0, 10);

  try {
    const res = await fetch(KNOTTS_HOURS_URL, {
      headers: {
        // Some sites block default server UAs. This header is intentionally generic.
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      // If the remote site is slow/hanging, fail fast rather than keeping the widget stuck.
      signal: AbortSignal.timeout(12_000),
    });

    if (!res.ok) {
      return Response.json(
        {
          date: dateIso,
          open: false,
          parkName: "Knott's Berry Farm",
          hoursText: "Could not load hours right now (source blocked).",
        } satisfies KnottsParkHours,
        { status: 200 },
      );
    }

    const html = await res.text();
    const parsed = extractHoursForDateFromHtml(html, dateIso);

    if (parsed) {
      return Response.json(parsed, { status: 200 });
    }

    return Response.json(
      {
        date: dateIso,
        open: false,
        parkName: "Knott's Berry Farm",
        hoursText: "Could not parse official hours (format changed).",
      } satisfies KnottsParkHours,
      { status: 200 },
    );
  } catch {
    return Response.json(
      {
        date: dateIso,
        open: false,
        parkName: "Knott's Berry Farm",
        hoursText: "Could not load hours right now.",
      } satisfies KnottsParkHours,
      { status: 200 },
    );
  }
}

