export type MemberRole = "parent" | "kid";

export interface FamilyMember {
  id: string;
  name: string;
  role: MemberRole;
  color: string; // Used for schedule color coding
}

export type WidgetKey =
  | "spacex"
  | "sports"
  | "schedule"
  | "screenshotToSchedule"
  | "messages"
  | "quickLinks"
  | "knott"
  | "weather"
  | "worldClock"
  | "news"
  | "tesla";

export type WidgetVisibility = "visible" | "hidden";

export interface WidgetConfig {
  key: WidgetKey;
  title: string;
  visible: WidgetVisibility;
  collapsed: boolean;
}

export type ScheduleViewFilter = "today" | "7_days" | "all";

export interface ScheduleEvent {
  id: string;
  title: string;
  description?: string;
  startAt: string; // ISO
  endAt?: string; // ISO
  ownerMemberId: string;
  // Optional tags for UI filtering
  tags?: string[];
  // If this came from screenshot parsing, keep structured provenance
  parsed?: ParsedEvent;
  createdAt: string; // ISO
}

export interface SportsTeam {
  id: string;
  name: string;
  abbreviation: string;
  league: "MLB" | "NBA" | "NFL" | "NHL" | "NCAA" | "WNBA" | "MLS";
  color: string;
}

export interface SportsGame {
  id: string;
  startAt: string; // ISO
  homeTeamId: string;
  awayTeamId: string;
  homeScore?: number;
  awayScore?: number;
  status: "scheduled" | "final" | "live";
  venue?: string;
  externalUrl?: string;
}

export interface LaunchEvent {
  id: string;
  missionName: string;
  netTime: string; // ISO
  status: "scheduled" | "in_progress" | "success" | "failed" | "unknown";
  rocket: string;
  launchSite: string;
  externalUrl: string;
}

export interface QuickLink {
  id: string;
  label: string;
  url: string;
  icon: string; // lucide icon name
  color: string; // used for tile accent
}

export interface MessagePost {
  id: string;
  authorMemberId: string;
  createdAt: string; // ISO
  content: string;
  pinned: boolean;
}

export interface ParsedEvent {
  id: string;
  extractedTeamName?: string;
  extractedDate?: string; // ISO date (yyyy-mm-dd) or full ISO
  extractedTime?: string; // "HH:MM"
  confidence: number; // 0..1
  // For screenshot parsing UX
  notes?: string;
}

export interface WorldClock {
  id: string;
  label: string;
  timeZone: string; // IANA TZ
}

export type NewsCategory =
  | "Top"
  | "Politics"
  | "Technology"
  | "Sports"
  | "Health"
  | "Entertainment";

export interface NewsItem {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt: string; // ISO
  category: NewsCategory;
}

export interface TeslaStatus {
  batteryPercent: number; // 0..100
  charging: boolean;
  rangeMiles: number;
  updatedAt: string; // ISO
}

export interface WeatherStatus {
  id: string;
  locationLabel: string;
  temperatureC: number;
  feelsLikeC?: number;
  windKph?: number;
  precipitationMm?: number;
  weatherCode: number;
  description: string;
  updatedAt: string; // ISO
}

