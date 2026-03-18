"use client";

import * as React from "react";
import Link from "next/link";
import { Search, Settings } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { FamilyMember } from "@/types/familyHub";
import { useFamilyHubStore } from "@/store/familyHubStore";

type SearchResult =
  | { kind: "Schedule"; id: string; title: string; widgetKey: "schedule"; subtitle?: string }
  | { kind: "Link"; id: string; title: string; widgetKey: "quickLinks"; subtitle?: string }
  | { kind: "Message"; id: string; title: string; widgetKey: "messages"; subtitle?: string };

export function FamilyHeader({
  currentTimeLabel,
  onOpenSettings,
}: {
  currentTimeLabel: string;
  onOpenSettings: (tab?: "family" | "widgets" | "appearance" | "time") => void;
}) {
  const members = useFamilyHubStore((s) => s.members);
  const activeMemberId = useFamilyHubStore((s) => s.activeMemberId);
  const setActiveMemberId = useFamilyHubStore((s) => s.setActiveMemberId);

  const schedule = useFamilyHubStore((s) => s.schedule);
  const quickLinks = useFamilyHubStore((s) => s.quickLinks);
  const messages = useFamilyHubStore((s) => s.messages);
  const hiddenWidgetCount = useFamilyHubStore((s) => Object.values(s.widgetUiByMemberId[s.activeMemberId] ?? {}).reduce((acc, ui) => (ui.visible === "hidden" ? acc + 1 : acc), 0));

  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const results: SearchResult[] = React.useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return [];

    const out: SearchResult[] = [];
    for (const ev of schedule) {
      const hay = `${ev.title} ${(ev.description ?? "")}`.toLowerCase();
      if (hay.includes(query)) {
        out.push({ kind: "Schedule", id: ev.id, title: ev.title, widgetKey: "schedule", subtitle: new Date(ev.startAt).toLocaleString() });
      }
    }
    for (const l of quickLinks) {
      if (l.label.toLowerCase().includes(query)) out.push({ kind: "Link", id: l.id, title: l.label, widgetKey: "quickLinks", subtitle: l.url });
    }
    for (const m of messages) {
      const author = members.find((mm: FamilyMember) => mm.id === m.authorMemberId)?.name ?? "Someone";
      if (m.content.toLowerCase().includes(query)) {
        out.push({
          kind: "Message",
          id: m.id,
          title: m.content.length > 48 ? `${m.content.slice(0, 48)}…` : m.content,
          widgetKey: "messages",
          subtitle: `${author} • ${new Date(m.createdAt).toLocaleString()}`,
        });
      }
    }
    return out.slice(0, 8);
  }, [q, schedule, quickLinks, messages, members]);

  return (
    <header className="sticky top-0 z-20 border-b border-black/5 bg-white/70 backdrop-blur dark:bg-black/65 dark:border-white/20">
      <div className="mx-auto flex max-w-[1400px] items-start justify-between gap-4 px-4 py-3 md:items-center">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-sky-400 to-pink-400 shadow-sm" />
            <div className="min-w-0">
              <div className="truncate text-lg font-semibold">Family Hub OS</div>
              <div className="text-xs text-black/60 dark:text-white/85">{currentTimeLabel}</div>
            </div>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-end gap-3">
          <div className="relative hidden w-[420px] md:block" aria-live="polite">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40 dark:text-white/85" />
            <Input
              ref={inputRef}
              className="pl-9"
              placeholder="Search schedules, links, messages…"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              onBlur={() => {
                // Delay so clicks inside the popover can register.
                window.setTimeout(() => setOpen(false), 120);
              }}
            />
            {open && results.length > 0 && (
              <div className="absolute left-0 right-0 top-[46px] z-30 rounded-2xl border border-black/10 bg-white/95 p-1 shadow-lg backdrop-blur dark:border-white/20 dark:bg-black/90">
                {results.map((r) => (
                  <button
                    key={`${r.kind}_${r.id}`}
                    className="flex w-full items-start gap-3 rounded-xl px-3 py-2 text-left hover:bg-black/5 dark:hover:bg-white/5"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      const el = document.getElementById(`widget-${r.widgetKey}`);
                      el?.scrollIntoView({ behavior: "smooth", block: "center" });
                      setOpen(false);
                      setQ("");
                      inputRef.current?.blur();
                    }}
                  >
                    <div className="mt-0.5 rounded-full bg-black/5 px-2 py-0.5 text-[11px] font-medium text-black/70 dark:bg-white/15 dark:text-white/85">
                      {r.kind}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{r.title}</div>
                      {r.subtitle ? <div className="truncate text-xs text-black/60 dark:text-white/85">{r.subtitle}</div> : null}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button variant="secondary" className="rounded-full" onClick={() => onOpenSettings("family")}>
              <Settings className="h-4 w-4" />
              Settings
            </Button>

            {hiddenWidgetCount > 0 ? (
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => onOpenSettings("widgets")}
                aria-label="Restore hidden widgets"
              >
                Widgets ({hiddenWidgetCount})
              </Button>
            ) : null}

            <Link href="/march-madness">
              <Button variant="secondary" className="rounded-full">
                March Madness
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-4 pb-3 md:hidden">
        <Tabs value={activeMemberId} onValueChange={(v) => setActiveMemberId(v)}>
          <TabsList className="w-full justify-between">
            {members.map((m) => (
              <TabsTrigger key={m.id} value={m.id} className="flex-1">
                {m.name}
              </TabsTrigger>
            ))}
          </TabsList>
          {members.map((m) => (
            <TabsContent key={m.id} value={m.id}>
              <div className="mt-2 text-xs text-black/60 dark:text-white/85">
                You’re viewing as <span className="font-medium">{m.name}</span>.
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </header>
  );
}

