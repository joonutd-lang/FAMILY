import type {
  FamilyMember,
  LaunchEvent,
  MessagePost,
  NewsCategory,
  NewsItem,
  QuickLink,
  ScheduleEvent,
  SportsTeam,
  TeslaStatus,
  TeslaVehicle,
  WorldClock,
  MarchMadnessGame,
  MarchMadnessStatus,
} from "@/types/familyHub";
import type { WidgetConfig, WidgetKey } from "@/types/familyHub";

export interface SeedData {
  members: FamilyMember[];
  schedule: ScheduleEvent[];
  messages: MessagePost[];
  quickLinks: QuickLink[];
  favoriteSportsTeams: string[]; // team ids
  sportsTeams: SportsTeam[];
  worldClocks: WorldClock[];
  widgets: Record<WidgetKey, WidgetConfig>;
  newsCategories: NewsCategory[];
  teslaVehicles: TeslaVehicle[];
  initialTheme: "light" | "dark";
  initialCompactMode: boolean;
  initialWorldClockIds: string[];
  weatherDefaultLocationLabel: string;
}

const members: FamilyMember[] = [
  { id: "m_aya", name: "Joon", role: "kid", color: "#60a5fa" },
  { id: "m_noah", name: "Michelle", role: "kid", color: "#34d399" },
  { id: "m_jen", name: "Rebecca", role: "parent", color: "#f472b6" },
  { id: "m_mike", name: "Abigail", role: "parent", color: "#fb7185" },
];

const now = new Date();
const todayIso = now.toISOString().slice(0, 10);
const addDaysIso = (days: number) => {
  const d = new Date(now);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const at = (date: string, hhmm: string) => new Date(`${date}T${hhmm}:00`).toISOString();

const schedule: ScheduleEvent[] = [
  {
    id: "se_1",
    title: "Karate practice",
    description: "Bring water bottle + white belt.",
    startAt: at(todayIso, "17:15"),
    endAt: at(todayIso, "18:00"),
    ownerMemberId: "m_aya",
    tags: ["activities"],
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: "se_2",
    title: "Soccer practice",
    description: "Shin guards required.",
    startAt: at(todayIso, "18:30"),
    endAt: at(todayIso, "19:30"),
    ownerMemberId: "m_noah",
    tags: ["sports"],
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: "se_3",
    title: "Family dinner at home",
    description: "Try the new recipe!",
    startAt: at(todayIso, "19:15"),
    endAt: at(todayIso, "20:00"),
    ownerMemberId: "m_jen",
    tags: ["family"],
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 1).toISOString(),
  },
  {
    id: "se_4",
    title: "School picture day",
    startAt: at(addDaysIso(2), "08:15"),
    endAt: at(addDaysIso(2), "09:30"),
    ownerMemberId: "m_aya",
    tags: ["school"],
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    parsed: {
      id: "pe_school_pics",
      confidence: 0.86,
      extractedDate: addDaysIso(2),
      extractedTime: "08:15",
      extractedTeamName: "School",
      notes: "Created from a screenshot parse demo.",
    },
  },
  {
    id: "se_5",
    title: "Weekend hike",
    startAt: at(addDaysIso(5), "09:00"),
    endAt: at(addDaysIso(5), "12:00"),
    ownerMemberId: "m_mike",
    tags: ["family", "outdoors"],
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
];

const messages: MessagePost[] = [
  {
    id: "mp_1",
    authorMemberId: "m_jen",
    createdAt: new Date(now.getTime() - 1000 * 60 * 55).toISOString(),
    content: "Aya: karate starts at 5:15. Please arrive 10 minutes early!",
    pinned: true,
  },
  {
    id: "mp_2",
    authorMemberId: "m_mike",
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 6).toISOString(),
    content: "Noah game day snack list: banana + water. I packed it already.",
    pinned: false,
  },
  {
    id: "mp_3",
    authorMemberId: "m_aya",
    createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 28).toISOString(),
    content: "Can we go to the arcade after dinner?",
    pinned: false,
  },
];

const quickLinks: QuickLink[] = [
  { id: "ql_1", label: "GameChanger", url: "https://www.gamechanger.io/", icon: "Camera", color: "#93c5fd" },
  { id: "ql_2", label: "School Portal", url: "https://example.com/", icon: "School", color: "#86efac" },
  { id: "ql_3", label: "Weather", url: "https://weather.com/", icon: "Cloud", color: "#fbbf24" },
  { id: "ql_4", label: "Sports Tickets", url: "https://www.stubhub.com/", icon: "Ticket", color: "#fca5a5" },
];

const sportsTeams: SportsTeam[] = [
  { id: "t_warriors", name: "Golden State Warriors", abbreviation: "GSW", league: "NBA", color: "#60a5fa" },
  { id: "t_lakers", name: "Los Angeles Lakers", abbreviation: "LAL", league: "NBA", color: "#fb7185" },
  { id: "t_patriots", name: "New England Patriots", abbreviation: "NE", league: "NFL", color: "#fbbf24" },
  { id: "t_kings", name: "Sacramento Kings", abbreviation: "SAC", league: "NBA", color: "#34d399" },
  { id: "t_duke", name: "Duke Blue Devils", abbreviation: "DUKE", league: "NCAA", color: "#60a5fa" },
  { id: "t_kansas", name: "Kansas Jayhawks", abbreviation: "KU", league: "NCAA", color: "#34d399" },
];

const worldClocks: WorldClock[] = [
  { id: "wc_korea", label: "Korea (Seoul)", timeZone: "Asia/Seoul" },
  { id: "wc_michigan", label: "Michigan (Detroit)", timeZone: "America/Detroit" },
  { id: "wc_california", label: "California (LA)", timeZone: "America/Los_Angeles" },
];

const widgets: Record<WidgetKey, WidgetConfig> = {
  spacex: { key: "spacex", title: "SpaceX Launch", visible: "visible", collapsed: false },
  sports: { key: "sports", title: "Sports Teams", visible: "visible", collapsed: false },
  schedule: { key: "schedule", title: "Family Schedule", visible: "visible", collapsed: false },
  screenshotToSchedule: { key: "screenshotToSchedule", title: "Screenshot → Schedule", visible: "visible", collapsed: false },
  messages: { key: "messages", title: "Message Board", visible: "visible", collapsed: false },
  quickLinks: { key: "quickLinks", title: "Quick Links", visible: "visible", collapsed: false },
  knott: { key: "knott", title: "Knott's Berry Farm", visible: "visible", collapsed: false },
  weather: { key: "weather", title: "Weather", visible: "visible", collapsed: false },
  marchMadness: { key: "marchMadness", title: "March Madness", visible: "visible", collapsed: false },
  worldClock: { key: "worldClock", title: "World Clock", visible: "visible", collapsed: false },
  news: { key: "news", title: "Top US News", visible: "visible", collapsed: false },
  tesla: { key: "tesla", title: "Tesla Status", visible: "visible", collapsed: false },
};

const newsCategories: NewsCategory[] = ["Top", "Politics", "Technology", "Sports", "Health", "Entertainment"];

// (Not used directly in the store yet, but useful for services.)
export const seedTesla: TeslaStatus = {
  batteryPercent: 81,
  charging: false,
  rangeMiles: 287,
  updatedAt: new Date().toISOString(),
};

export const seedTeslaVehicles: TeslaVehicle[] = [
  { id: "tv_tesla1", nickname: "Tesla 1", vin: "5YJ3E1EA7HF000001" },
  { id: "tv_tesla2", nickname: "Tesla 2", vin: "5YJ3E1EA7HF000002" },
];

export const seedTeslaByVehicleId: Record<string, TeslaStatus> = {
  tv_tesla1: {
    batteryPercent: 81,
    charging: false,
    rangeMiles: 287,
    updatedAt: new Date().toISOString(),
  },
  tv_tesla2: {
    batteryPercent: 64,
    charging: true,
    rangeMiles: 231,
    updatedAt: new Date().toISOString(),
  },
};

export const seedData: SeedData = {
  members,
  schedule,
  messages,
  quickLinks,
  // Start "blank" so the user can add teams from the widget UI.
  favoriteSportsTeams: [],
  sportsTeams,
  worldClocks,
  widgets,
  newsCategories,
  teslaVehicles: seedTeslaVehicles,
  initialTheme: "light",
  initialCompactMode: false,
  // Start "blank" so World Clock ADD is usable out of the box.
  initialWorldClockIds: [],
  weatherDefaultLocationLabel: "California (LA)",
};

export const seedLaunch: LaunchEvent = {
  id: "lx_demo",
  missionName: "Demo Mission (Mock)",
  netTime: new Date(Date.now() + 1000 * 60 * 60 * 6).toISOString(),
  status: "scheduled",
  rocket: "Falcon 9 Block 5",
  launchSite: "Vandenberg SFB, CA",
  externalUrl: "https://www.spacex.com/",
};

export const seedNews: NewsItem[] = [
  {
    id: "n_1",
    title: "Market rally continues as investors watch upcoming earnings",
    url: "https://example.com/news/1",
    source: "US News Wire",
    publishedAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    category: "Top",
  },
  {
    id: "n_2",
    title: "New breakthrough promises faster battery recycling",
    url: "https://example.com/news/2",
    source: "Tech Today",
    publishedAt: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
    category: "Technology",
  },
  {
    id: "n_3",
    title: "Wild weekend in sports: last-second shot seals the win",
    url: "https://example.com/news/3",
    source: "Sports Desk",
    publishedAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    category: "Sports",
  },
];

