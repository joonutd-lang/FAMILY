"use client";

import * as React from "react";
import { useFamilyHubStore } from "@/store/familyHubStore";
import { screenshotParserService } from "@/lib/services/screenshotParserService";
import type { ParsedEvent, ScheduleEvent } from "@/types/familyHub";
import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useInterval } from "@/lib/hooks/useInterval";
import { formatDateShort } from "@/lib/utils/time";
import { Separator } from "@/components/ui/separator";
import { Upload, Sparkles } from "lucide-react";

function combineDateTime(dateIso: string, timeHhmm: string) {
  // dateIso: yyyy-mm-dd
  const [hh, mm] = timeHhmm.split(":");
  const d = new Date(`${dateIso}T${hh}:${mm}:00`);
  return d.toISOString();
}

export function ScreenshotToScheduleWidget() {
  const members = useFamilyHubStore((s) => s.members);
  const addScheduleEvent = useFamilyHubStore((s) => s.addScheduleEvent);
  const [selectedMemberId, setSelectedMemberId] = React.useState(members[0]?.id ?? "");

  React.useEffect(() => {
    if (!selectedMemberId && members[0]?.id) setSelectedMemberId(members[0].id);
  }, [members, selectedMemberId]);

  const [file, setFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [parsing, setParsing] = React.useState(false);
  const [parsedEvents, setParsedEvents] = React.useState<ParsedEvent[]>([]);

  const [editedDate, setEditedDate] = React.useState<string>("");
  const [editedTime, setEditedTime] = React.useState<string>("");
  const [editedTeam, setEditedTeam] = React.useState<string>("");
  const [editedNotes, setEditedNotes] = React.useState<string>("");

  React.useEffect(() => {
    if (!parsedEvents.length) return;
    const pe = parsedEvents[0];
    setEditedDate(pe.extractedDate ?? "");
    setEditedTime(pe.extractedTime ?? "");
    setEditedTeam(pe.extractedTeamName ?? "");
    setEditedNotes(pe.notes ?? pe.id);
  }, [parsedEvents]);

  React.useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const onFileChange = (f: File | null) => {
    setParsedEvents([]);
    setEditedDate("");
    setEditedTime("");
    setEditedTeam("");
    setEditedNotes("");
    setFile(f);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (f) {
      const url = URL.createObjectURL(f);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const canSave = !!editedDate && !!editedTime && !!editedTeam && !!selectedMemberId;

  const saveToSchedule = () => {
    if (!canSave) return;
    const startAt = combineDateTime(editedDate, editedTime);
    const title = `Game vs ${editedTeam}`;
    addScheduleEvent({
      id: `se_${crypto.randomUUID()}`,
      title,
      description: "Created from screenshot parsing.",
      ownerMemberId: selectedMemberId,
      startAt,
      endAt: undefined,
      createdAt: new Date().toISOString(),
      tags: ["parsed"],
      parsed: {
        ...(parsedEvents[0] ?? { id: `pe_${Date.now()}`, confidence: 0.7 }),
        extractedDate: editedDate,
        extractedTime: editedTime,
        extractedTeamName: editedTeam,
        notes: editedNotes,
      },
    } as ScheduleEvent);
    // Reset UI after save
    setParsedEvents([]);
    setFile(null);
    setPreviewUrl(null);
    setEditedDate("");
    setEditedTime("");
    setEditedTeam("");
    setEditedNotes("");
  };

  return (
    <CardContent className="h-full">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Upload className="h-4 w-4 text-black/60 dark:text-white/85" />
            <div className="text-sm font-semibold">Screenshot → Schedule</div>
          </div>
          <div className="mt-1 text-xs text-black/60 dark:text-white/85">Upload a screenshot (GameChanger etc.) and convert it into an event.</div>
        </div>
      </div>

      <div className="mt-3 rounded-2xl border border-black/10 bg-white/95 p-3 dark:bg-black/55">
        <div className="flex flex-col gap-2">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
            className="text-sm"
          />

          {previewUrl ? (
            <div className="overflow-hidden rounded-2xl border border-black/10 bg-white/95">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="Screenshot preview" className="max-h-[240px] w-full object-contain" />
            </div>
          ) : (
            <div className="text-sm text-black/60 dark:text-white/85">Choose an image to preview.</div>
          )}

          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-black/60 dark:text-white/85">{file ? `Ready: ${file.name}` : "No file selected"}</div>
            <Button
              className="rounded-full"
              disabled={!file || parsing}
              onClick={async () => {
                if (!file) return;
                setParsing(true);
                try {
                  const out = await screenshotParserService.parseScreenshot(file);
                  setParsedEvents(out);
                } finally {
                  setParsing(false);
                }
              }}
            >
              <Sparkles className="h-4 w-4" />
              {parsing ? "Parsing…" : "Parse screenshot"}
            </Button>
          </div>
        </div>

        {parsedEvents.length > 0 ? (
          <>
            <Separator className="my-3" />
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">Extracted details</div>
                  <div className="mt-1 text-xs text-black/60 dark:text-white/85">
                    Edit before saving. (Mock OCR with confidence.)
                  </div>
                </div>
                <Badge variant="info">
                  Confidence {Math.round((parsedEvents[0]?.confidence ?? 0) * 100)}%
                </Badge>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div>
                  <div className="text-xs font-medium text-black/60 dark:text-white/85">Date</div>
                  <Input type="date" value={editedDate} onChange={(e) => setEditedDate(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <div className="text-xs font-medium text-black/60 dark:text-white/85">Time</div>
                  <Input type="time" value={editedTime} onChange={(e) => setEditedTime(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <div className="text-xs font-medium text-black/60 dark:text-white/85">Team</div>
                  <Input value={editedTeam} onChange={(e) => setEditedTeam(e.target.value)} placeholder="e.g. Warriors" className="mt-1" />
                </div>
              </div>

              <div>
                <div className="text-xs font-medium text-black/60 dark:text-white/85">Assign to family member</div>
                <select
                  className="h-10 mt-1 w-full rounded-2xl border border-black/10 bg-white/95 px-3 text-sm dark:border-white/20 dark:bg-black/55"
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="text-xs font-medium text-black/60 dark:text-white/85">Notes (optional)</div>
                <Textarea value={editedNotes} onChange={(e) => setEditedNotes(e.target.value)} className="mt-1" />
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="text-xs text-black/60 dark:text-white/85">
                  Preview:{" "}
                  <span className="font-medium text-black/80 dark:text-white/80">
                    {editedDate && editedTime ? `${formatDateShort(new Date(editedDate))} • ${editedTime}` : "—"}
                  </span>{" "}
                  • {editedTeam ? `vs ${editedTeam}` : ""}
                </div>
                <Button className="rounded-full" disabled={!canSave} onClick={saveToSchedule}>
                  Save to schedule
                </Button>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </CardContent>
  );
}

