import type { WeatherStatus } from "@/types/familyHub";
import { mockDelay } from "./mockDelay";

// Keyless provider: Open-Meteo. No API key required.
const OPEN_METEO_BASE = "https://api.open-meteo.com/v1/forecast";

function mapWeatherCodeToDescription(code: number) {
  // Common Open-Meteo codes
  const table: Record<number, string> = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Light freezing drizzle",
    57: "Dense freezing drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snow fall",
    73: "Moderate snow fall",
    75: "Heavy snow fall",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
  };
  return table[code] ?? `Weather code ${code}`;
}

export const weatherService = {
  async getWeatherForLocation(params: { latitude: number; longitude: number; locationLabel: string }): Promise<WeatherStatus> {
    await mockDelay(250);

    const url = new URL(OPEN_METEO_BASE);
    url.searchParams.set("latitude", String(params.latitude));
    url.searchParams.set("longitude", String(params.longitude));
    url.searchParams.set("current", ["temperature_2m", "feels_like", "wind_speed_10m", "precipitation", "weather_code"].join(","));
    url.searchParams.set("timezone", "America/Los_Angeles");

    const res = await fetch(url.toString(), { method: "GET" });
    if (!res.ok) throw new Error(`Weather request failed: ${res.status}`);
    type OpenMeteoResponse = {
      current?: {
        temperature_2m?: number;
        feels_like?: number;
        wind_speed_10m?: number;
        precipitation?: number;
        weather_code?: number;
      };
    };
    const data = (await res.json()) as unknown as OpenMeteoResponse;

    const now = data?.current;
    const weatherCode = Number(now?.weather_code ?? 0);
    const updatedAt = new Date().toISOString();

    return {
      id: `wx_${params.latitude}_${params.longitude}`,
      locationLabel: params.locationLabel,
      temperatureC: Number(now?.temperature_2m ?? 0),
      feelsLikeC: now?.feels_like === undefined ? undefined : Number(now?.feels_like),
      windKph: now?.wind_speed_10m === undefined ? undefined : Number(now?.wind_speed_10m),
      precipitationMm: now?.precipitation === undefined ? undefined : Number(now?.precipitation),
      weatherCode,
      description: mapWeatherCodeToDescription(weatherCode),
      updatedAt,
    };
  },
};

