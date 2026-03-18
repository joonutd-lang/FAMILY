"use client";

import * as React from "react";
import { useFamilyHubStore } from "@/store/familyHubStore";
import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import type { QuickLink } from "@/types/familyHub";
import { Pencil, Plus, Trash2, Link as LinkIcon, Camera, Cloud, Ticket, School, Globe } from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Link: LinkIcon,
  Camera,
  Cloud,
  Ticket,
  School,
  Globe,
};

export function QuickLinksWidget() {
  const quickLinks = useFamilyHubStore((s) => s.quickLinks);
  const upsertQuickLink = useFamilyHubStore((s) => s.upsertQuickLink);
  const removeQuickLink = useFamilyHubStore((s) => s.removeQuickLink);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [label, setLabel] = React.useState("");
  const [url, setUrl] = React.useState("");
  const [icon, setIcon] = React.useState("Link");
  const [color, setColor] = React.useState("#93c5fd");

  const startNew = () => {
    setEditingId(null);
    setLabel("");
    setUrl("");
    setIcon("Link");
    setColor("#93c5fd");
    setDialogOpen(true);
  };

  const startEdit = (l: QuickLink) => {
    setEditingId(l.id);
    setLabel(l.label);
    setUrl(l.url);
    setIcon(l.icon);
    setColor(l.color);
    setDialogOpen(true);
  };

  const save = () => {
    const cleanLabel = label.trim();
    const cleanUrl = url.trim();
    if (!cleanLabel || !cleanUrl) return;
    upsertQuickLink({
      id: editingId ?? `ql_${crypto.randomUUID()}`,
      label: cleanLabel,
      url: cleanUrl,
      icon: icon.trim() || "Link",
      color,
    });
    setDialogOpen(false);
  };

  return (
    <CardContent className="h-full">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">Quick Links</div>
          <div className="mt-1 text-xs text-black/60 dark:text-white/85">Tap a tile for instant access.</div>
        </div>
        <Button className="rounded-full" onClick={startNew}>
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>

      <Separator className="my-3" />

      <div className="grid grid-cols-2 gap-2">
        {quickLinks.map((l) => {
          const Icon = iconMap[l.icon] ?? LinkIcon;
          return (
            <div key={l.id} className="relative overflow-hidden rounded-2xl border border-black/10 bg-white/95 p-3 dark:bg-black/45">
              <button
                className="flex h-full w-full flex-col items-start gap-2 text-left"
                onClick={() => window.open(l.url, "_blank", "noopener,noreferrer")}
              >
                <div className="flex items-center justify-between gap-3 w-full">
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon className="h-4 w-4 text-black/60 dark:text-white/85" />
                    <div className="min-w-0 truncate text-sm font-semibold">{l.label}</div>
                  </div>
                    <Badge variant="default" className="bg-black/5 dark:bg-white/15">{l.icon}</Badge>
                </div>
                <div className="mt-auto text-xs text-black/60 dark:text-white/85 line-clamp-2">
                  {l.url}
                </div>
              </button>

              <div className="absolute right-2 top-2 flex gap-1">
                <button
                  className="rounded-full bg-white/95 p-1 text-black/60 hover:bg-white"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    startEdit(l);
                  }}
                  aria-label={`Edit ${l.label}`}
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  className="rounded-full bg-white/95 p-1 text-red-600 hover:bg-white"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    removeQuickLink(l.id);
                  }}
                  aria-label={`Remove ${l.label}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="pointer-events-none absolute inset-0 opacity-60" style={{ background: `radial-gradient(circle at 20% 20%, ${l.color}55, transparent 55%)` }} />
            </div>
          );
        })}

        {quickLinks.length === 0 ? <div className="col-span-2 text-sm text-black/60 dark:text-white/85">No quick links yet.</div> : null}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit quick link" : "New quick link"}</DialogTitle>
            <DialogDescription>Customize label, icon, and destination URL.</DialogDescription>
          </DialogHeader>

          <div className="mt-3 grid grid-cols-1 gap-3">
              <div>
                <div className="text-xs font-medium text-black/60 dark:text-white/85">Label</div>
              <Input value={label} onChange={(e) => setLabel(e.target.value)} className="mt-1" placeholder="e.g. GameChanger" />
            </div>
            <div>
              <div className="text-xs font-medium text-black/60 dark:text-white/85">URL</div>
              <Input value={url} onChange={(e) => setUrl(e.target.value)} className="mt-1" placeholder="https://..." />
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <div className="text-xs font-medium text-black/60 dark:text-white/85">Icon name</div>
                <Input value={icon} onChange={(e) => setIcon(e.target.value)} className="mt-1" placeholder="Camera, Ticket, Cloud…" />
              </div>
              <div>
                <div className="text-xs font-medium text-black/60 dark:text-white/85">Tile color</div>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="h-10 w-16 rounded-2xl border border-black/10 bg-white/95 p-1 dark:border-white/20 dark:bg-black/55"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button className="rounded-full" disabled={!label.trim() || !url.trim()} onClick={save}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CardContent>
  );
}

