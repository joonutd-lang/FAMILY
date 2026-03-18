"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { StateStorage } from "zustand/middleware";
import type {
  FamilyMember,
  MessagePost,
  NewsCategory,
  PackingItem,
  QuickLink,
  ScheduleEvent,
  SportsTeam,
  WidgetKey,
  WidgetConfig,
  WidgetVisibility,
  TeslaVehicle,
} from "@/types/familyHub";
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
  // Member-specific UI state (visibility/collapse)
  widgetUiByMemberId: Record<string, Record<WidgetKey, { visible: WidgetVisibility; collapsed: boolean }>>;
  // Member-specific layout state (x/y/w/h)
  widgetLayoutsByMemberId: Record<string, Record<WidgetKey, WidgetLayoutItemShape>>;

  packingItemsByMember: Record<string, PackingItem[]>;

  teslaVehicles: TeslaVehicle[];
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
  resetWidgetLayoutsToDefault: (memberId?: string) => void;

  setNewsCategory: (category: NewsCategory) => void;

  // Quick links
  upsertQuickLink: (link: QuickLink) => void;
  removeQuickLink: (id: string) => void;

  // Packing checklist
  addPackingItem: (params: { memberId: string; label: string }) => void;
  togglePackingItemChecked: (params: { memberId: string; itemId: string }) => void;
  resetPackingForMember: (memberId: string) => void;

  // Tesla vehicles
  addTeslaVehicle: (params: { nickname: string; vin?: string }) => void;
  removeTeslaVehicle: (vehicleId: string) => void;

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
      widgetUiByMemberId: Object.fromEntries(
        seedData.members.map((m) => [
          m.id,
          Object.fromEntries(
            Object.keys(seedData.widgets).map((k) => {
              const key = k as WidgetKey;
              return [key, { visible: seedData.widgets[key].visible, collapsed: seedData.widgets[key].collapsed }];
            }),
          ),
        ]),
      ) as Record<string, Record<WidgetKey, { visible: WidgetVisibility; collapsed: boolean }>>,
      widgetLayoutsByMemberId: Object.fromEntries(
        seedData.members.map((m) => [
          m.id,
          {
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
          } as Record<WidgetKey, WidgetLayoutItemShape>,
        ]),
      ) as Record<string, Record<WidgetKey, WidgetLayoutItemShape>>,

      packingItemsByMember: Object.fromEntries(seedData.members.map((m) => [m.id, []])),

      teslaVehicles: seedData.teslaVehicles ?? [],

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
          if (existing) return { members };

          // Initialize per-member widget UI + layout for new members.
          const defaultUi = Object.fromEntries(
            Object.keys(s.widgets).map((k) => {
              const key = k as WidgetKey;
              return [key, { visible: s.widgets[key].visible, collapsed: s.widgets[key].collapsed }];
            }),
          ) as Record<WidgetKey, { visible: WidgetVisibility; collapsed: boolean }>;

          const defaultLayouts: Record<WidgetKey, WidgetLayoutItemShape> = {
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
          };

          return {
            members,
            widgetUiByMemberId: { ...s.widgetUiByMemberId, [member.id]: defaultUi },
            widgetLayoutsByMemberId: { ...s.widgetLayoutsByMemberId, [member.id]: defaultLayouts },
          };
        }),
      removeMember: (id) =>
        set((s) => ({
          members: s.members.filter((m) => m.id !== id),
          activeMemberId: s.activeMemberId === id ? (s.members.find((m) => m.id !== id)?.id ?? id) : s.activeMemberId,
          widgetUiByMemberId: Object.fromEntries(Object.entries(s.widgetUiByMemberId).filter(([mid]) => mid !== id)) as FamilyHubStorePersistedState["widgetUiByMemberId"],
          widgetLayoutsByMemberId: Object.fromEntries(Object.entries(s.widgetLayoutsByMemberId).filter(([mid]) => mid !== id)) as FamilyHubStorePersistedState["widgetLayoutsByMemberId"],
        })),

      setFavoriteSportsTeamIds: (ids) => set({ favoriteSportsTeamIds: ids }),
      setWorldClockIds: (ids) => set({ worldClockIds: ids }),
      setNewsCategory: (category) => set({ newsCategory: category }),

      setWidgetVisible: (key, visible) =>
        set((s) => {
          const memberId = s.activeMemberId;
          const memberUi = s.widgetUiByMemberId[memberId] ?? ({} as Record<WidgetKey, { visible: WidgetVisibility; collapsed: boolean }>);
          const prevVisible = memberUi[key]?.visible ?? "visible";

          // When turning a widget back on, place it below current visible content.
          // This prevents it from re-appearing in an outdated position that overlaps
          // widgets the user has moved while it was hidden.
          let nextWidgetLayouts = s.widgetLayoutsByMemberId[memberId] ?? ({} as Record<WidgetKey, WidgetLayoutItemShape>);
          if (visible === "visible" && prevVisible === "hidden") {
            const current = nextWidgetLayouts[key];
            if (current) {
              const otherVisibleKeys = Object.keys(s.widgets) as WidgetKey[];
              const maxBottom = Math.max(
                0,
                ...otherVisibleKeys
                  .filter((k) => k !== key && (memberUi[k]?.visible ?? "visible") === "visible")
                  .map((k) => {
                    const l = nextWidgetLayouts[k];
                    return (l?.y ?? 0) + (l?.h ?? 0);
                  }),
              );

              const safeY = current.y < maxBottom ? maxBottom + 1 : current.y;
              nextWidgetLayouts = {
                ...nextWidgetLayouts,
                [key]: { ...current, y: safeY },
              };
            }
          }

          const nextMemberUi = {
            ...memberUi,
            [key]: { ...(memberUi[key] ?? { visible: "visible" as const, collapsed: s.widgets[key]?.collapsed ?? false }), visible },
          };

          return {
            widgetUiByMemberId: {
              ...s.widgetUiByMemberId,
              [memberId]: nextMemberUi,
            },
            widgetLayoutsByMemberId: {
              ...s.widgetLayoutsByMemberId,
              [memberId]: nextWidgetLayouts,
            },
          };
        }),
      setWidgetCollapsed: (key, collapsed) =>
        set((s) => {
          const memberId = s.activeMemberId;
          const memberUi = s.widgetUiByMemberId[memberId] ?? ({} as Record<WidgetKey, { visible: WidgetVisibility; collapsed: boolean }>);
          const nextMemberUi = {
            ...memberUi,
            [key]: {
              visible: memberUi[key]?.visible ?? s.widgets[key]?.visible ?? "visible",
              collapsed,
            },
          };

          const memberLayouts = s.widgetLayoutsByMemberId[memberId] ?? ({} as Record<WidgetKey, WidgetLayoutItemShape>);
          const current = memberLayouts[key];
          const nextLayout = current ? { ...current, h: collapsed ? 2 : current.minH ?? current.h } : current;

          return {
            widgetUiByMemberId: {
              ...s.widgetUiByMemberId,
              [memberId]: nextMemberUi,
            },
            widgetLayoutsByMemberId: {
              ...s.widgetLayoutsByMemberId,
              [memberId]: nextLayout
                ? {
                    ...memberLayouts,
                    [key]: nextLayout,
                  }
                : memberLayouts,
            },
          };
        }),

      setWidgetLayouts: (layouts) =>
        set((s) => {
          const memberId = s.activeMemberId;
          const current = s.widgetLayoutsByMemberId[memberId] ?? ({} as Record<WidgetKey, WidgetLayoutItemShape>);
          const next = { ...current };
          for (const it of layouts) {
            const key = it.i as WidgetKey;
            if (!next[key]) continue;
            next[key] = { ...next[key], ...it };
          }
          return {
            widgetLayoutsByMemberId: {
              ...s.widgetLayoutsByMemberId,
              [memberId]: next,
            },
          };
        }),

      resetWidgetLayoutsToDefault: (memberIdParam) => {
        set((s) => {
          const memberId = memberIdParam ?? s.activeMemberId;
          const ui = s.widgetUiByMemberId[memberId] ?? ({} as Record<WidgetKey, { visible: WidgetVisibility; collapsed: boolean }>);

          const base: Record<WidgetKey, WidgetLayoutItemShape> = {
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
          };

          const collapsedAdjusted = Object.fromEntries(
            Object.entries(base).map(([k, l]) => {
              const key = k as WidgetKey;
              const collapsed = ui[key]?.collapsed ?? false;
              return [key, { ...l, h: collapsed ? 2 : l.minH ?? l.h }];
            }),
          ) as Record<WidgetKey, WidgetLayoutItemShape>;

          return {
            widgetLayoutsByMemberId: {
              ...s.widgetLayoutsByMemberId,
              [memberId]: collapsedAdjusted,
            },
          };
        });
      },

      upsertQuickLink: (link) =>
        set((s) => {
          const exists = s.quickLinks.some((l) => l.id === link.id);
          return { quickLinks: exists ? s.quickLinks.map((l) => (l.id === link.id ? link : l)) : [link, ...s.quickLinks] };
        }),
      removeQuickLink: (id) => set((s) => ({ quickLinks: s.quickLinks.filter((l) => l.id !== id) })),

      addPackingItem: ({ memberId, label }) =>
        set((s) => ({
          packingItemsByMember: {
            ...s.packingItemsByMember,
            [memberId]: [
              {
                id: `pk_${crypto.randomUUID()}`,
                label,
                addedByMemberId: memberId,
                createdAt: new Date().toISOString(),
                checkedByMemberIds: [],
              },
              ...(s.packingItemsByMember[memberId] ?? []),
            ],
          },
        })),

      togglePackingItemChecked: ({ memberId, itemId }) =>
        set((s) => {
          const list = s.packingItemsByMember[memberId] ?? [];
          return {
            packingItemsByMember: {
              ...s.packingItemsByMember,
              [memberId]: list.map((it) => {
                if (it.id !== itemId) return it;
                const has = it.checkedByMemberIds.includes(memberId);
                return {
                  ...it,
                  checkedByMemberIds: has
                    ? it.checkedByMemberIds.filter((x) => x !== memberId)
                    : [...it.checkedByMemberIds, memberId],
                };
              }),
            },
          };
        }),

      resetPackingForMember: (memberId) =>
        set((s) => ({
          packingItemsByMember: {
            ...s.packingItemsByMember,
            [memberId]: [],
          },
        })),

      addTeslaVehicle: ({ nickname, vin }) =>
        set((s) => {
          const clean = nickname.trim();
          if (!clean) return s;
          const id = `tv_${crypto.randomUUID()}`;
          const vehicle: TeslaVehicle = { id, nickname: clean, vin: vin?.trim() || undefined };
          return { teslaVehicles: [vehicle, ...s.teslaVehicles] };
        }),

      removeTeslaVehicle: (vehicleId) =>
        set((s) => ({ teslaVehicles: s.teslaVehicles.filter((v) => v.id !== vehicleId) })),

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
      version: 2,
      partialize: (s) => s as FamilyHubStorePersistedState & ReadOnlySlice,
      migrate: (persistedState: unknown, _version: number) => {
        // Handle previously persisted state when we introduced per-member widget UI/layout
        // and Tesla vehicle support.
        const state = (persistedState ?? {}) as Partial<FamilyHubStorePersistedState & ReadOnlySlice> & {
          widgetLayouts?: Record<WidgetKey, WidgetLayoutItemShape>;
          // Older versions might have this shape.
        };

        const members = state.members ?? seedData.members;
        const widgets = state.widgets ?? seedData.widgets;

        // If per-member ui/layout is missing, derive it from the older global widgets/widgetLayouts.
        const widgetUiByMemberId =
          state.widgetUiByMemberId ??
          Object.fromEntries(
            members.map((m) => [
              m.id,
              Object.fromEntries(
                (Object.keys(widgets) as WidgetKey[]).map((k) => [
                  k,
                  { visible: widgets[k].visible, collapsed: widgets[k].collapsed },
                ]),
              ),
            ]),
          );

        const defaultLayouts: Record<WidgetKey, WidgetLayoutItemShape> = {
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
        };

        const widgetLayoutsByMemberId =
          state.widgetLayoutsByMemberId ??
          Object.fromEntries(members.map((m) => [m.id, (state.widgetLayouts as any) ?? defaultLayouts]));

        // Tesla is deferred: force it hidden in all persisted dashboards.
        for (const mid of Object.keys(widgetUiByMemberId)) {
          const ui = (widgetUiByMemberId as FamilyHubStorePersistedState["widgetUiByMemberId"])[mid];
          if (ui?.tesla) ui.tesla = { ...ui.tesla, visible: "hidden" };
        }

        return {
          ...state,
          members,
          widgets,
          widgetUiByMemberId,
          widgetLayoutsByMemberId,
        };
      },
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") return serverStorage;
        return window.localStorage;
      }),
    },
  ),
);

