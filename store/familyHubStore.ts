"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { StateStorage } from "zustand/middleware";
import type { FamilyMember, MessagePost, NewsCategory, QuickLink, ScheduleEvent, SportsTeam, WidgetKey, WidgetConfig } from "@/types/familyHub";
import type { WidgetLayoutItem as WidgetLayoutItemShape } from "@/types/layout";
import { seedData } from "@/data/seed";

export type ThemeMode = "light" | "dark";

const serverStorage: StateStorage<void> = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export interface FamilyHubStoreState {
  activeMemberId: string;

  theme: ThemeMode;
  compactMode: boolean;

  members: FamilyMember[];
  schedule: ScheduleEvent[];
  messages: { [id: string]: { post: Omit<(typeof seedData)["messages"][number], "id"> & { id: string } } };
  // Above shape is overkill; we will normalize as needed below.
}

// Keep store types explicit, but avoid circular type inference from seed.
type SeedScheduleEvent = ScheduleEvent;
type SeedMessagePost = {
  id: string;
  authorMemberId: string;
  createdAt: string;
  content: string;
  pinned: boolean;
};
type SeedSportsTeam = SportsTeam;

interface FamilyHubStorePersistedState {
  activeMemberId: string;
  theme: ThemeMode;
  compactMode: boolean;

  members: FamilyMember[];
  schedule: SeedScheduleEvent[];
  messages: SeedMessagePost[];
  quickLinks: QuickLink[];

  favoriteSportsTeamIds: string[];
  worldClockIds: string[];
  newsCategory: NewsCategory;

  widgets: Record<WidgetKey, WidgetConfig>;
  widgetLayouts: Record<WidgetKey, WidgetLayoutItemShape>;
}

export interface FamilyHubActions {
  setActiveMemberId: (id: string) => void;
  setTheme: (t: ThemeMode) => void;
  setCompactMode: (v: boolean) => void;

  // Family settings
  upsertMember: (member: FamilyMember) => void;
  removeMember: (id: string) => void;

  setFavoriteSportsTeamIds: (ids: string[]) => void;
  setWorldClockIds: (ids: string[]) => void;

  // Widgets
  setWidgetVisible: (key: WidgetKey, visible: "visible" | "hidden") => void;
  setWidgetCollapsed: (key: WidgetKey, collapsed: boolean) => void;
  setWidgetLayouts: (layouts: WidgetLayoutItemShape[]) => void;
  resetWidgetLayoutsToDefault: () => void;

  setNewsCategory: (category: NewsCategory) => void;

  // Quick links
  upsertQuickLink: (link: QuickLink) => void;
  removeQuickLink: (id: string) => void;

  // Schedule
  addScheduleEvent: (ev: ScheduleEvent) => void;
  updateScheduleEvent: (ev: ScheduleEvent) => void;
  deleteScheduleEvent: (id: string) => void;

  // Messages
  togglePinned: (postId: string) => void;
  markPostReadForActiveMember: (postId: string) => void;
  markAllReadForActiveMember: () => void;
  addMessagePost: (post: Omit<MessagePost, "id" | "createdAt"> & { id?: string; createdAt?: string }) => void;
  toggleWidgetPinAndRead?: never;

  // Read tracking
  messageReadByMember: Record<string, string[]>; // memberId -> postIds read
}

type ReadOnlySlice = {
  messageReadByMember: Record<string, string[]>;
  newsCategory: NewsCategory;
};

export const useFamilyHubStore = create<FamilyHubStorePersistedState & ReadOnlySlice & FamilyHubActions>()(
  persist(
    (set, get) => ({
      activeMemberId: seedData.members[0]?.id ?? "m_aya",
      theme: seedData.initialTheme,
      compactMode: seedData.initialCompactMode,

      members: seedData.members,
      schedule: seedData.schedule,
      messages: seedData.messages,
      quickLinks: seedData.quickLinks,

      favoriteSportsTeamIds: seedData.favoriteSportsTeams,
      worldClockIds: seedData.initialWorldClockIds,
      newsCategory: "Top",

      widgets: seedData.widgets,
      widgetLayouts: {
        spacex: { i: "spacex", x: 0, y: 0, w: 4, h: 4, minW: 3, minH: 3 },
        sports: { i: "sports", x: 4, y: 0, w: 4, h: 4, minW: 3, minH: 3 },
        weather: { i: "weather", x: 8, y: 0, w: 4, h: 3, minW: 3, minH: 2 },
        tesla: { i: "tesla", x: 8, y: 3, w: 4, h: 3, minW: 3, minH: 2 },
        knott: { i: "knott", x: 0, y: 4, w: 4, h: 3, minW: 3, minH: 2 },
        worldClock: { i: "worldClock", x: 4, y: 4, w: 4, h: 3, minW: 3, minH: 2 },
        news: { i: "news", x: 8, y: 6, w: 4, h: 4, minW: 3, minH: 3 },
        schedule: { i: "schedule", x: 0, y: 7, w: 6, h: 7, minW: 4, minH: 4 },
        messages: { i: "messages", x: 6, y: 7, w: 6, h: 6, minW: 4, minH: 4 },
        quickLinks: { i: "quickLinks", x: 0, y: 14, w: 6, h: 4, minW: 4, minH: 3 },
        screenshotToSchedule: { i: "screenshotToSchedule", x: 6, y: 13, w: 6, h: 5, minW: 4, minH: 3 },
        marchMadness: { i: "marchMadness", x: 0, y: 18, w: 6, h: 5, minW: 4, minH: 3 },
      },

      messageReadByMember: {
        [seedData.members[0]?.id ?? "m_aya"]: [],
      },

      setActiveMemberId: (id) => set({ activeMemberId: id }),
      setTheme: (t) => set({ theme: t }),
      setCompactMode: (v) => set({ compactMode: v }),

      upsertMember: (member) =>
        set((s) => {
          const existing = s.members.find((m) => m.id === member.id);
          const members = existing ? s.members.map((m) => (m.id === member.id ? member : m)) : [member, ...s.members];
          return { members };
        }),
      removeMember: (id) =>
        set((s) => ({
          members: s.members.filter((m) => m.id !== id),
          activeMemberId: s.activeMemberId === id ? (s.members.find((m) => m.id !== id)?.id ?? id) : s.activeMemberId,
        })),

      setFavoriteSportsTeamIds: (ids) => set({ favoriteSportsTeamIds: ids }),
      setWorldClockIds: (ids) => set({ worldClockIds: ids }),
      setNewsCategory: (category) => set({ newsCategory: category }),

      setWidgetVisible: (key, visible) =>
        set((s) => ({
          widgets: {
            ...s.widgets,
            [key]: { ...s.widgets[key], visible },
          },
        })),
      setWidgetCollapsed: (key, collapsed) =>
        set((s) => ({
          widgets: {
            ...s.widgets,
            [key]: { ...s.widgets[key], collapsed },
          },
          widgetLayouts: {
            ...s.widgetLayouts,
            [key]: { ...s.widgetLayouts[key], h: collapsed ? 2 : s.widgetLayouts[key].minH ?? s.widgetLayouts[key].h },
          },
        })),

      setWidgetLayouts: (layouts) =>
        set((s) => {
          const next = { ...s.widgetLayouts };
          for (const it of layouts) {
            const key = it.i as WidgetKey;
            if (!next[key]) continue;
            next[key] = { ...next[key], ...it };
          }
          return { widgetLayouts: next };
        }),

      resetWidgetLayoutsToDefault: () => {
        set((s) => ({
          widgetLayouts: {
            ...s.widgetLayouts,
            spacex: { i: "spacex", x: 0, y: 0, w: 4, h: 4, minW: 3, minH: 3 },
            sports: { i: "sports", x: 4, y: 0, w: 4, h: 4, minW: 3, minH: 3 },
            weather: { i: "weather", x: 8, y: 0, w: 4, h: 3, minW: 3, minH: 2 },
            tesla: { i: "tesla", x: 8, y: 3, w: 4, h: 3, minW: 3, minH: 2 },
            knott: { i: "knott", x: 0, y: 4, w: 4, h: 3, minW: 3, minH: 2 },
            worldClock: { i: "worldClock", x: 4, y: 4, w: 4, h: 3, minW: 3, minH: 2 },
            news: { i: "news", x: 8, y: 6, w: 4, h: 4, minW: 3, minH: 3 },
            schedule: { i: "schedule", x: 0, y: 7, w: 6, h: 7, minW: 4, minH: 4 },
            messages: { i: "messages", x: 6, y: 7, w: 6, h: 6, minW: 4, minH: 4 },
            quickLinks: { i: "quickLinks", x: 0, y: 14, w: 6, h: 4, minW: 4, minH: 3 },
            screenshotToSchedule: { i: "screenshotToSchedule", x: 6, y: 13, w: 6, h: 5, minW: 4, minH: 3 },
            marchMadness: { i: "marchMadness", x: 0, y: 18, w: 6, h: 5, minW: 4, minH: 3 },
          },
        }));
      },

      upsertQuickLink: (link) =>
        set((s) => {
          const exists = s.quickLinks.some((l) => l.id === link.id);
          return { quickLinks: exists ? s.quickLinks.map((l) => (l.id === link.id ? link : l)) : [link, ...s.quickLinks] };
        }),
      removeQuickLink: (id) => set((s) => ({ quickLinks: s.quickLinks.filter((l) => l.id !== id) })),

      addScheduleEvent: (ev) => set((s) => ({ schedule: [ev, ...s.schedule] })),
      updateScheduleEvent: (ev) =>
        set((s) => ({ schedule: s.schedule.map((e) => (e.id === ev.id ? ev : e)) })),
      deleteScheduleEvent: (id) => set((s) => ({ schedule: s.schedule.filter((e) => e.id !== id) })),

      togglePinned: (postId) =>
        set((s) => ({ messages: s.messages.map((p) => (p.id === postId ? { ...p, pinned: !p.pinned } : p)) })),

      markPostReadForActiveMember: (postId) =>
        set((s) => {
          const memberId = s.activeMemberId;
          const current = s.messageReadByMember[memberId] ?? [];
          if (current.includes(postId)) return s;
          return {
            messageReadByMember: {
              ...s.messageReadByMember,
              [memberId]: [...current, postId],
            },
          };
        }),
      markAllReadForActiveMember: () =>
        set((s) => ({
          messageReadByMember: {
            ...s.messageReadByMember,
            [s.activeMemberId]: s.messages.map((m) => m.id),
          },
        })),

      addMessagePost: (post) =>
        set((s) => ({
          messages: [
            {
              id: post.id ?? `mp_${crypto.randomUUID()}`,
              authorMemberId: post.authorMemberId,
              content: post.content,
              pinned: !!post.pinned,
              createdAt: post.createdAt ?? new Date().toISOString(),
            },
            ...s.messages,
          ],
        })),
      toggleWidgetPinAndRead: undefined as never,
    }),
    {
      name: "family-hub-os:v1",
      version: 1,
      partialize: (s) => s as FamilyHubStorePersistedState & ReadOnlySlice,
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") return serverStorage;
        return window.localStorage;
      }),
    },
  ),
);

