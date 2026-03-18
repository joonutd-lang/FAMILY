"use client";

import * as React from "react";
import { useFamilyHubStore } from "@/store/familyHubStore";
import type { ScheduleEvent, ScheduleViewFilter } from "@/types/familyHub";
import { CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDateShort, formatTimeShort, toIsoDate } from "@/lib/utils/time";
import { ScreenshotToScheduleWidget } from "@/components/widgets/ScreenshotToScheduleWidget";
import { Trash2, Plus } from "lucide-react";

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
  const deleteScheduleEvent = useFamilyHubStore((s) => s.deleteScheduleEvent);

  const [filter, setFilter] = React.useState<ScheduleViewFilter>("today");
  const [tab, setTab] = React.useState<"timeline" | "agenda">("timeline");
  const [captureOpen, setCaptureOpen] = React.useState(false);

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

  return (
    <CardContent className="h-full">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold">Family Schedule</div>
          <div className="mt-1 text-xs text-black/60 dark:text-white/85">
            캡쳐/사진으로 일정 추가 → 자동으로 여기서 보이게 해요.
          </div>
        </div>
        <Button
          className="rounded-full"
          onClick={() => setCaptureOpen(true)}
          aria-label="Add schedule via screenshot"
        >
          <Plus className="h-4 w-4" />
          Capture
        </Button>
      </div>

      <div className="mt-3 rounded-2xl border border-black/10 bg-white/60 p-3 dark:bg-black/55">
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
          <Tabs value={tab} onValueChange={(v) => setTab(v === "agenda" ? "agenda" : "timeline")}>
            <TabsList className="rounded-full bg-black/5 p-1 dark:bg-white/5">
              <TabsTrigger value="timeline" className="rounded-full">Timeline</TabsTrigger>
              <TabsTrigger value="agenda" className="rounded-full">Agenda</TabsTrigger>
            </TabsList>

            <TabsContent value="timeline">
              {visibleEvents.length === 0 ? (
                <div className="mt-3 text-sm text-black/60 dark:text-white/85">No events in this range.</div>
              ) : (
                <div className="mt-3 space-y-2">
                  {visibleEvents.map((ev) => {
                    const m = memberById.get(ev.ownerMemberId);
                    const start = new Date(ev.startAt);
                    return (
                      <div
                        key={ev.id}
                        className="rounded-2xl border border-black/10 bg-white/70 p-3 dark:bg-black/40"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className="h-2.5 w-2.5 rounded-full"
                                style={{ background: m?.color ?? "#999" }}
                              />
                              <div className="text-sm font-semibold truncate">{ev.title}</div>
                            </div>
                            <div className="mt-1 text-xs text-black/60 dark:text-white/85 flex items-center gap-2">
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
                <div className="mt-3 text-sm text-black/60 dark:text-white/85">No events in this range.</div>
              ) : (
                <div className="mt-3 space-y-3">
                  {groupedByDate.map(([dateIso, events]) => (
                    <div key={dateIso} className="space-y-2">
                      <div className="text-xs font-semibold text-black/60 dark:text-white/85">
                        {formatDateShort(new Date(dateIso))}
                      </div>
                      {events.map((ev) => {
                        const m = memberById.get(ev.ownerMemberId);
                        const start = new Date(ev.startAt);
                        return (
                            <div
                              key={ev.id}
                              className="rounded-2xl border border-black/10 bg-white/70 p-3 dark:bg-black/40"
                            >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="h-2.5 w-2.5 rounded-full"
                                    style={{ background: m?.color ?? "#999" }}
                                  />
                                  <div className="truncate text-sm font-semibold">{ev.title}</div>
                                </div>
                                <div className="mt-1 text-xs text-black/60 dark:text-white/85">
                                  {formatTimeShort(start)} {ev.endAt ? `• ${formatTimeShort(new Date(ev.endAt))}` : ""}
                                  {ev.parsed ? (
                                    <span className="ml-2">
                                      <Badge variant="info">Parsed {Math.round((ev.parsed.confidence ?? 0) * 100)}%</Badge>
                                    </span>
                                  ) : null}
                                </div>
                                {ev.description ? (
                                  <div className="mt-2 text-sm text-black/70 dark:text-white/85">{ev.description}</div>
                                ) : null}
                              </div>
                              <div className="flex items-center gap-2">
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
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <Separator className="my-3" />

        <div className="text-xs text-black/60 dark:text-white/85">
          Tip: `Capture`를 누르고 사진/캡쳐를 올리면, 모의 OCR 결과를 보여준 다음 저장할 수 있어요.
        </div>
      </div>

      <Dialog open={captureOpen} onOpenChange={setCaptureOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add schedule from a screenshot</DialogTitle>
            <DialogDescription>
              준비: GameChanger/캘린더 화면을 캡쳐하거나, 사진을 찍어서 올려주세요. (모의 OCR로 날짜/시간/팀을 추출)
            </DialogDescription>
          </DialogHeader>
          <div className="mt-3 h-[70vh]">
            <ScreenshotToScheduleWidget />
          </div>
        </DialogContent>
      </Dialog>
    </CardContent>
  );
}

