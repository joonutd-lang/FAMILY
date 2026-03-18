"use client";

import * as React from "react";
import { useFamilyHubStore } from "@/store/familyHubStore";
import type { FamilyMember, ScheduleEvent, ScheduleViewFilter, WidgetKey } from "@/types/familyHub";
import { CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useInterval } from "@/lib/hooks/useInterval";
import { formatDateShort, formatTimeShort, toIsoDate } from "@/lib/utils/time";
import { cn } from "@/lib/utils/cn";
import { Trash2, Edit2, Plus } from "lucide-react";

function parseDateTimeLocal(v: string) {
  // v like "2026-03-18T17:15"
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function toDateTimeLocalValue(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function withinRange(ev: ScheduleEvent, filter: ScheduleViewFilter) {
  const start = new Date(ev.startAt).getTime();
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setHours(23, 59, 59, 999);

  if (filter === "today") return start >= todayStart.getTime() && start <= todayEnd.getTime();

  if (filter === "7_days") {
    const end = new Date(todayStart);
    end.setDate(end.getDate() + 7);
    return start >= todayStart.getTime() && start <= end.getTime();
  }

  return true;
}

function byStartAt(a: ScheduleEvent, b: ScheduleEvent) {
  return new Date(a.startAt).getTime() - new Date(b.startAt).getTime();
}

export function FamilyScheduleWidget() {
  const members = useFamilyHubStore((s) => s.members);
  const schedule = useFamilyHubStore((s) => s.schedule);
  const addScheduleEvent = useFamilyHubStore((s) => s.addScheduleEvent);
  const updateScheduleEvent = useFamilyHubStore((s) => s.updateScheduleEvent);
  const deleteScheduleEvent = useFamilyHubStore((s) => s.deleteScheduleEvent);

  const [filter, setFilter] = React.useState<ScheduleViewFilter>("today");
  const [tab, setTab] = React.useState<"timeline" | "agenda">("timeline");

  const [editorOpen, setEditorOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);

  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [ownerMemberId, setOwnerMemberId] = React.useState<string>(members[0]?.id ?? "");
  const [startAt, setStartAt] = React.useState<string>("");
  const [endAt, setEndAt] = React.useState<string>("");

  const now = new Date();
  useInterval(() => {
    // force small rerender for timeline “today” context, but keep simple
    void now;
  }, 60_000);

  React.useEffect(() => {
    if (!editorOpen) return;
    if (!editingId) return;
    const ev = schedule.find((e) => e.id === editingId);
    if (!ev) return;
    setTitle(ev.title);
    setDescription(ev.description ?? "");
    setOwnerMemberId(ev.ownerMemberId);
    setStartAt(toDateTimeLocalValue(ev.startAt));
    setEndAt(ev.endAt ? toDateTimeLocalValue(ev.endAt) : "");
  }, [editorOpen, editingId, schedule]);

  const visibleEvents = React.useMemo(() => {
    return schedule.filter((ev) => withinRange(ev, filter)).slice().sort(byStartAt);
  }, [schedule, filter]);

  const groupedByDate = React.useMemo(() => {
    const map = new Map<string, ScheduleEvent[]>();
    for (const ev of visibleEvents) {
      const k = toIsoDate(ev.startAt);
      const arr = map.get(k) ?? [];
      arr.push(ev);
      map.set(k, arr);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [visibleEvents]);

  const memberById = React.useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);

  const openNew = () => {
    setEditingId(null);
    setTitle("");
    setDescription("");
    const defaultOwner = members[0]?.id ?? "";
    setOwnerMemberId(defaultOwner);
    const d = new Date();
    d.setHours(d.getHours() + 1);
    setStartAt(toDateTimeLocalValue(d.toISOString()));
    setEndAt("");
    setEditorOpen(true);
  };

  const save = () => {
    const cleanTitle = title.trim();
    if (!cleanTitle || !ownerMemberId || !startAt) return;
    const isoStart = parseDateTimeLocal(startAt);
    if (!isoStart) return;
    const isoEnd = endAt ? parseDateTimeLocal(endAt) ?? undefined : undefined;

    if (editingId) {
      const existing = schedule.find((e) => e.id === editingId);
      updateScheduleEvent({
        id: editingId,
        title: cleanTitle,
        description: description.trim() || undefined,
        ownerMemberId,
        startAt: isoStart,
        endAt: isoEnd,
        tags: existing?.tags ?? [],
        parsed: existing?.parsed,
        createdAt: existing?.createdAt ?? new Date().toISOString(),
      });
    } else {
      addScheduleEvent({
        id: `se_${crypto.randomUUID()}`,
        title: cleanTitle,
        description: description.trim() || undefined,
        ownerMemberId,
        startAt: isoStart,
        endAt: isoEnd,
        tags: [],
        createdAt: new Date().toISOString(),
      });
    }
    setEditorOpen(false);
  };

  const editorEvent = editingId ? schedule.find((e) => e.id === editingId) : null;

  // Quick add quick bar state
  const [quickTitle, setQuickTitle] = React.useState("");
  const [quickOwnerId, setQuickOwnerId] = React.useState<string>(members[0]?.id ?? "");
  const [quickStart, setQuickStart] = React.useState<string>(() => {
    const d = new Date();
    d.setHours(d.getHours() + 2);
    return toDateTimeLocalValue(d.toISOString());
  });

  React.useEffect(() => {
    if (!quickOwnerId && members[0]?.id) setQuickOwnerId(members[0].id);
  }, [members, quickOwnerId]);

  const onQuickAdd = () => {
    const clean = quickTitle.trim();
    if (!clean) return;
    const isoStart = parseDateTimeLocal(quickStart);
    if (!isoStart) return;
    addScheduleEvent({
      id: `se_${crypto.randomUUID()}`,
      title: clean,
      description: undefined,
      ownerMemberId: quickOwnerId,
      startAt: isoStart,
      endAt: undefined,
      createdAt: new Date().toISOString(),
      tags: [],
    });
    setQuickTitle("");
  };

  return (
    <CardContent className="h-full">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold">Family Schedule</div>
          <div className="mt-1 text-xs text-black/60 dark:text-white/60">Timeline + agenda. Color-coded by person.</div>
        </div>
        <Button className="rounded-full" onClick={openNew}>
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>

      <div className="mt-3 rounded-2xl border border-black/10 bg-white/60 p-3 dark:bg-black/30">
        <div className="flex flex-wrap items-center gap-2">
          {(["today", "7_days", "all"] as ScheduleViewFilter[]).map((k) => (
            <Button
              key={k}
              variant={filter === k ? "default" : "ghost"}
              className="rounded-full"
              onClick={() => setFilter(k)}
            >
              {k === "today" ? "Today" : k === "7_days" ? "Next 7 days" : "All"}
            </Button>
          ))}
        </div>

        <div className="mt-3">
          <Tabs
            value={tab}
            onValueChange={(v) => setTab(v === "agenda" ? "agenda" : "timeline")}
          >
            <TabsList className="rounded-full bg-black/5 p-1 dark:bg-white/5">
              <TabsTrigger value="timeline" className="rounded-full">Timeline</TabsTrigger>
              <TabsTrigger value="agenda" className="rounded-full">Agenda</TabsTrigger>
            </TabsList>

            <TabsContent value="timeline">
              {visibleEvents.length === 0 ? (
                <div className="mt-3 text-sm text-black/60 dark:text-white/60">No events in this range.</div>
              ) : (
                <div className="mt-3 space-y-2">
                  {visibleEvents.map((ev) => {
                    const m = memberById.get(ev.ownerMemberId);
                    const start = new Date(ev.startAt);
                    return (
                      <div key={ev.id} className="rounded-2xl border border-black/10 bg-white/70 p-3 dark:bg-black/20">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="h-2.5 w-2.5 rounded-full" style={{ background: m?.color ?? "#999" }} />
                              <div className="text-sm font-semibold truncate">{ev.title}</div>
                            </div>
                            <div className="mt-1 text-xs text-black/60 dark:text-white/60 flex items-center gap-2">
                              <span>{formatTimeShort(start)}</span>
                              {ev.parsed ? <Badge variant="info">Parsed</Badge> : null}
                              {ev.description ? <span className="truncate">{ev.description}</span> : null}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="rounded-full"
                              onClick={() => {
                                setEditingId(ev.id);
                                setEditorOpen(true);
                              }}
                              aria-label="Edit event"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="rounded-full"
                              onClick={() => deleteScheduleEvent(ev.id)}
                              aria-label="Delete event"
                            >
                              <Trash2 className="h-4 w-4 text-red-600 dark:text-red-300" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="agenda">
              {groupedByDate.length === 0 ? (
                <div className="mt-3 text-sm text-black/60 dark:text-white/60">No events in this range.</div>
              ) : (
                <div className="mt-3 space-y-3">
                  {groupedByDate.map(([dateIso, events]) => (
                    <div key={dateIso} className="space-y-2">
                      <div className="text-xs font-semibold text-black/60 dark:text-white/60">{formatDateShort(new Date(dateIso))}</div>
                      {events.map((ev) => {
                        const m = memberById.get(ev.ownerMemberId);
                        const start = new Date(ev.startAt);
                        return (
                          <div key={ev.id} className="rounded-2xl border border-black/10 bg-white/70 p-3 dark:bg-black/20">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: m?.color ?? "#999" }} />
                                  <div className="truncate text-sm font-semibold">{ev.title}</div>
                                </div>
                                <div className="mt-1 text-xs text-black/60 dark:text-white/60">
                                  {formatTimeShort(start)} {ev.endAt ? `• ${formatTimeShort(new Date(ev.endAt))}` : ""}
                                  {ev.parsed ? <span className="ml-2"><Badge variant="info">Parsed {Math.round((ev.parsed.confidence ?? 0) * 100)}%</Badge></span> : null}
                                </div>
                                {ev.description ? <div className="mt-2 text-sm text-black/70 dark:text-white/70">{ev.description}</div> : null}
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="rounded-full"
                                  onClick={() => {
                                    setEditingId(ev.id);
                                    setEditorOpen(true);
                                  }}
                                  aria-label="Edit event"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="rounded-full" onClick={() => deleteScheduleEvent(ev.id)} aria-label="Delete event">
                                  <Trash2 className="h-4 w-4 text-red-600 dark:text-red-300" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <Separator className="my-3" />

        <div>
          <div className="text-xs font-semibold text-black/60 dark:text-white/60">Quick add</div>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Input value={quickTitle} onChange={(e) => setQuickTitle(e.target.value)} placeholder="Event title (e.g. Piano lessons)" />
            <select
              className="h-10 rounded-2xl border border-black/10 bg-white/70 px-3 text-sm dark:border-white/10 dark:bg-black/30"
              value={quickOwnerId}
              onChange={(e) => setQuickOwnerId(e.target.value)}
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.role})
                </option>
              ))}
            </select>
            <input
              className="h-10 rounded-2xl border border-black/10 bg-white/70 px-3 text-sm dark:border-white/10 dark:bg-black/30"
              type="datetime-local"
              value={quickStart}
              onChange={(e) => setQuickStart(e.target.value)}
            />
          </div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <div className="text-xs text-black/60 dark:text-white/60">Adds an event starting at the time you pick.</div>
            <Button className="rounded-full" onClick={onQuickAdd} disabled={!quickTitle.trim()}>
              Add
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit event" : "New event"}</DialogTitle>
            <DialogDescription>
              {editorEvent?.parsed ? "This event was parsed from a screenshot—edit details before saving." : "Add details for your family."}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-3 grid grid-cols-1 gap-3">
            <div>
              <div className="text-xs font-medium text-black/60 dark:text-white/60">Title</div>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title" className="mt-1" />
            </div>
            <div>
              <div className="text-xs font-medium text-black/60 dark:text-white/60">Owner</div>
              <select
                className="h-10 mt-1 w-full rounded-2xl border border-black/10 bg-white/70 px-3 text-sm dark:border-white/10 dark:bg-black/30"
                value={ownerMemberId}
                onChange={(e) => setOwnerMemberId(e.target.value)}
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.role})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <div className="text-xs font-medium text-black/60 dark:text-white/60">Start</div>
                <input
                  className="h-10 mt-1 w-full rounded-2xl border border-black/10 bg-white/70 px-3 text-sm dark:border-white/10 dark:bg-black/30"
                  type="datetime-local"
                  value={startAt}
                  onChange={(e) => setStartAt(e.target.value)}
                />
              </div>
              <div>
                <div className="text-xs font-medium text-black/60 dark:text-white/60">End (optional)</div>
                <input
                  className="h-10 mt-1 w-full rounded-2xl border border-black/10 bg-white/70 px-3 text-sm dark:border-white/10 dark:bg-black/30"
                  type="datetime-local"
                  value={endAt}
                  onChange={(e) => setEndAt(e.target.value)}
                />
              </div>
            </div>

            <div>
              <div className="text-xs font-medium text-black/60 dark:text-white/60">Notes (optional)</div>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1" placeholder="Bring water bottle, practice location, etc." />
            </div>

            {editorEvent?.parsed ? (
              <div className="rounded-2xl border border-black/10 bg-white/60 p-3 text-xs text-black/60 dark:bg-black/20 dark:text-white/60">
                Parsed details:
                <div className="mt-2">
                  Date: {editorEvent.parsed.extractedDate ?? "—"} • Time: {editorEvent.parsed.extractedTime ?? "—"} • Team:{" "}
                  {editorEvent.parsed.extractedTeamName ?? "—"} • Confidence: {Math.round(editorEvent.parsed.confidence * 100)}%
                </div>
              </div>
            ) : null}
          </div>

          <DialogFooter>
            {editingId ? (
              <Button
                variant="destructive"
                className="rounded-full"
                onClick={() => {
                  deleteScheduleEvent(editingId);
                  setEditorOpen(false);
                }}
              >
                Delete
              </Button>
            ) : (
              <div />
            )}
            <div className="flex items-center gap-2">
              <Button variant="outline" className="rounded-full" onClick={() => setEditorOpen(false)}>
                Cancel
              </Button>
              <Button className="rounded-full" onClick={save} disabled={!title.trim()}>
                Save
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CardContent>
  );
}

