"use client";

import * as React from "react";
import { Settings, Sparkles, Clock, Users, Link2, LayoutGrid } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useFamilyHubStore } from "@/store/familyHubStore";
import type { FamilyMember, QuickLink, SportsTeam } from "@/types/familyHub";
import { useQuery } from "@tanstack/react-query";
import { sportsService } from "@/lib/services/sportsService";
import { WidgetManagerModal } from "./WidgetManagerModal";
import { Textarea } from "@/components/ui/textarea";

type TabKey = "family" | "widgets" | "appearance" | "time";

export function SettingsDrawer({
  open,
  onOpenChange,
  initialTab,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialTab?: TabKey;
}) {
  const [widgetManagerOpen, setWidgetManagerOpen] = React.useState(false);
  const [tab, setTab] = React.useState<TabKey>(initialTab ?? "family");

  React.useEffect(() => {
    if (open && initialTab) setTab(initialTab);
  }, [open, initialTab]);

  const theme = useFamilyHubStore((s) => s.theme);
  const setTheme = useFamilyHubStore((s) => s.setTheme);
  const compactMode = useFamilyHubStore((s) => s.compactMode);
  const setCompactMode = useFamilyHubStore((s) => s.setCompactMode);

  const members = useFamilyHubStore((s) => s.members);
  const upsertMember = useFamilyHubStore((s) => s.upsertMember);
  const removeMember = useFamilyHubStore((s) => s.removeMember);

  const favoriteSportsTeamIds = useFamilyHubStore((s) => s.favoriteSportsTeamIds);
  const setFavoriteSportsTeamIds = useFamilyHubStore((s) => s.setFavoriteSportsTeamIds);

  const quickLinks = useFamilyHubStore((s) => s.quickLinks);
  const upsertQuickLink = useFamilyHubStore((s) => s.upsertQuickLink);
  const removeQuickLink = useFamilyHubStore((s) => s.removeQuickLink);

  const { data: allTeams } = useQuery({
    queryKey: ["sports:allTeams"],
    queryFn: () => sportsService.getAllTeams(),
  });

  const [newMemberName, setNewMemberName] = React.useState("");
  const [newMemberRole, setNewMemberRole] = React.useState<FamilyMember["role"]>("kid");
  const [newMemberColor, setNewMemberColor] = React.useState("#60a5fa");

  const [newLinkLabel, setNewLinkLabel] = React.useState("");
  const [newLinkUrl, setNewLinkUrl] = React.useState("");
  const [newLinkIcon, setNewLinkIcon] = React.useState("Link");
  const [newLinkColor, setNewLinkColor] = React.useState("#93c5fd");

  const toggleTeam = (teamId: string) => {
    const set = new Set(favoriteSportsTeamIds);
    if (set.has(teamId)) set.delete(teamId);
    else set.add(teamId);
    setFavoriteSportsTeamIds(Array.from(set));
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[1080px] p-0 overflow-hidden bg-transparent border-none dark:bg-transparent">
          <div className="flex h-[85vh] flex-col overflow-hidden rounded-2xl border border-black/10 bg-white/90 backdrop-blur dark:border-white/10 dark:bg-black/70">
            <DialogHeader className="px-5 py-4">
              <DialogTitle className="flex items-center gap-2 text-lg">
                <Settings className="h-5 w-5" />
                Settings
              </DialogTitle>
              <DialogDescription>Customize your family’s command center.</DialogDescription>
            </DialogHeader>

            <Separator />

            <div className="flex flex-1 overflow-hidden">
              <div className="w-full md:w-[280px] border-r border-black/10 px-4 py-4">
                <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
                  <TabsList className="w-full justify-start rounded-2xl bg-black/5 p-1 dark:bg-white/5">
                    <TabsTrigger value="family" className="flex-1 rounded-full"> <Users className="mr-2 h-4 w-4" /> Family</TabsTrigger>
                    <TabsTrigger value="widgets" className="flex-1 rounded-full"> <LayoutGrid className="mr-2 h-4 w-4" /> Widgets</TabsTrigger>
                    <TabsTrigger value="appearance" className="flex-1 rounded-full"> <Sparkles className="mr-2 h-4 w-4" /> Look</TabsTrigger>
                    <TabsTrigger value="time" className="flex-1 rounded-full"> <Clock className="mr-2 h-4 w-4" /> Time</TabsTrigger>
                  </TabsList>
                  <TabsContent value="family">
                    <div className="mt-4 space-y-3">
                      <div className="text-sm font-semibold">Family members</div>
                      <div className="flex flex-col gap-2">
                        {members.map((m) => (
                          <div key={m.id} className="flex items-center justify-between gap-3 rounded-2xl border border-black/10 bg-white/95 p-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="h-9 w-9 rounded-full" style={{ background: m.color }} />
                              <div className="min-w-0">
                                <div className="truncate text-sm font-medium">{m.name}</div>
                                <div className="text-xs text-black/60 dark:text-white/60">{m.role}</div>
                              </div>
                            </div>
                            <Button variant="ghost" onClick={() => removeMember(m.id)} className="text-red-600 hover:text-red-700 dark:text-red-300">Remove</Button>
                          </div>
                        ))}
                      </div>

                      <div className="rounded-2xl border border-black/10 bg-white/95 p-3">
                        <div className="text-xs font-medium text-black/60 dark:text-white/60">Add member</div>
                        <div className="mt-2 grid grid-cols-1 gap-2">
                          <Input value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)} placeholder="Name" />
                          <div className="flex items-center gap-2">
                            <select
                              className="h-10 flex-1 rounded-2xl border border-black/10 bg-white/95 px-3 text-sm dark:border-white/10 dark:bg-black/30"
                              value={newMemberRole}
                              onChange={(e) => setNewMemberRole(e.target.value as FamilyMember["role"])}
                            >
                              <option value="kid">Kid</option>
                              <option value="parent">Parent</option>
                            </select>
                            <input
                              aria-label="Color"
                              type="color"
                              value={newMemberColor}
                              onChange={(e) => setNewMemberColor(e.target.value)}
                              className="h-10 w-12 rounded-2xl border border-black/10 bg-white/95 p-1 dark:border-white/10 dark:bg-black/30"
                            />
                          </div>
                          <Button
                            className="rounded-full"
                            onClick={() => {
                              const name = newMemberName.trim();
                              if (!name) return;
                              const id = `m_${crypto.randomUUID()}`;
                              upsertMember({ id, name, role: newMemberRole, color: newMemberColor });
                              setNewMemberName("");
                            }}
                          >
                            Add
                          </Button>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="widgets">
                    <div className="mt-4 space-y-3">
                      <div className="text-sm font-semibold">Widgets</div>
                      <div className="rounded-2xl border border-black/10 bg-white/95 p-3">
                        <div className="text-sm font-medium">Manage visibility & layout</div>
                        <div className="mt-1 text-xs text-black/60 dark:text-white/60">
                          Drag widgets in the main grid. Use the Widget Manager for quick hide/collapse + reset layout.
                        </div>
                        <Button className="mt-3 rounded-full" onClick={() => setWidgetManagerOpen(true)}>
                          Open Widget Manager
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="appearance">
                    <div className="mt-4 space-y-3">
                      <div className="text-sm font-semibold">Appearance</div>
                      <div className="rounded-2xl border border-black/10 bg-white/95 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm font-medium">Theme</div>
                            <div className="text-xs text-black/60 dark:text-white/60">Clean light or cozy dark.</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-black/60 dark:text-white/60">Light</span>
                            <Switch checked={theme === "dark"} onCheckedChange={(v) => setTheme(v ? "dark" : "light")} />
                            <span className="text-xs text-black/60 dark:text-white/60">Dark</span>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-black/10 bg-white/95 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm font-medium">Compact mode</div>
                            <div className="text-xs text-black/60 dark:text-white/60">More widgets, tighter layout.</div>
                          </div>
                          <Switch checked={compactMode} onCheckedChange={(v) => setCompactMode(v)} />
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="time">
                    <div className="mt-4 space-y-3">
                      <div className="text-sm font-semibold">Time zones</div>
                      <div className="rounded-2xl border border-black/10 bg-white/95 p-3">
                        <div className="text-xs text-black/60 dark:text-white/60">
                          월드클락은 설정 메뉴가 아니라, <span className="font-medium">World Clock 위젯의 `+` 버튼</span>으로 추가해요.
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              <div className="flex-1 overflow-auto px-5 py-4">
                <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
                  <TabsList className="hidden md:flex mb-4 justify-start rounded-2xl bg-black/5 p-1 dark:bg-white/5">
                    <TabsTrigger value="family" className="rounded-full">Family</TabsTrigger>
                    <TabsTrigger value="widgets" className="rounded-full">Widgets</TabsTrigger>
                    <TabsTrigger value="appearance" className="rounded-full">Look</TabsTrigger>
                    <TabsTrigger value="time" className="rounded-full">Time</TabsTrigger>
                  </TabsList>

                  <TabsContent value="family">
                    <div className="space-y-4">
                      <div>
                        <div className="text-sm font-semibold">Favorite sports teams</div>
                        <div className="mt-1 text-xs text-black/60 dark:text-white/60">These feed the Sports widget.</div>
                      </div>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {(allTeams ?? [])?.map((t) => {
                          const on = favoriteSportsTeamIds.includes(t.id);
                          return (
                            <button
                              key={t.id}
                              className={`flex items-center justify-between gap-3 rounded-2xl border px-3 py-2 text-left ${
                                on ? "border-black/15 bg-white/90" : "border-black/10 bg-white/95 hover:bg-white/90"
                              } dark:hover:bg-black/40`}
                              onClick={() => toggleTeam(t.id)}
                            >
                              <div className="min-w-0">
                                <div className="truncate text-sm font-medium">{t.name}</div>
                                <div className="text-xs text-black/60 dark:text-white/60">{t.league} • {t.abbreviation}</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="h-3.5 w-3.5 rounded-full" style={{ background: t.color }} />
                                <span className="text-xs text-black/60 dark:text-white/60">{on ? "On" : "Off"}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      <Separator />

                      <div>
                        <div className="text-sm font-semibold">Quick links</div>
                        <div className="mt-1 text-xs text-black/60 dark:text-white/60">Shortcuts your family uses often.</div>
                      </div>
                      <div className="space-y-2">
                        {quickLinks.map((l) => (
                          <div key={l.id} className="flex items-center justify-between gap-3 rounded-2xl border border-black/10 bg-white/95 p-3">
                            <div className="min-w-0 flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full" style={{ background: l.color }} />
                              <div className="min-w-0">
                                <div className="truncate text-sm font-medium">{l.label}</div>
                                <div className="truncate text-xs text-black/60 dark:text-white/60">{l.url}</div>
                              </div>
                            </div>
                            <Button variant="ghost" onClick={() => removeQuickLink(l.id)} className="text-red-600 hover:text-red-700 dark:text-red-300">
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>

                      <div className="rounded-2xl border border-black/10 bg-white/95 p-3">
                        <div className="text-xs font-medium text-black/60 dark:text-white/60">Add link</div>
                        <div className="mt-2 grid grid-cols-1 gap-2">
                          <Input value={newLinkLabel} onChange={(e) => setNewLinkLabel(e.target.value)} placeholder="Label (e.g. GameChanger)" />
                          <Input value={newLinkUrl} onChange={(e) => setNewLinkUrl(e.target.value)} placeholder="https://..." />
                          <div className="flex items-center gap-2">
                            <Input value={newLinkIcon} onChange={(e) => setNewLinkIcon(e.target.value)} placeholder="Icon name (e.g. Camera)" />
                            <input
                              aria-label="Link color"
                              type="color"
                              value={newLinkColor}
                              onChange={(e) => setNewLinkColor(e.target.value)}
                              className="h-10 w-12 rounded-2xl border border-black/10 bg-white/95 p-1 dark:border-white/10 dark:bg-black/30"
                            />
                          </div>
                          <Button
                            className="rounded-full"
                            onClick={() => {
                              const label = newLinkLabel.trim();
                              const url = newLinkUrl.trim();
                              if (!label || !url) return;
                              upsertQuickLink({
                                id: `ql_${crypto.randomUUID()}`,
                                label,
                                url,
                                icon: newLinkIcon.trim() || "Link",
                                color: newLinkColor,
                              });
                              setNewLinkLabel("");
                              setNewLinkUrl("");
                            }}
                          >
                            Add
                          </Button>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="widgets">
                    <div className="space-y-3">
                      <div className="text-sm font-semibold">Rearrange widgets</div>
                      <div className="text-xs text-black/60 dark:text-white/60">
                        Use drag handles on each widget’s top-left. Resize from widget edges. This layout will persist in your browser.
                      </div>
                      <Button className="rounded-full" onClick={() => setWidgetManagerOpen(true)}>Manage widgets</Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="appearance">
                    <div className="space-y-3">
                      <div className="text-sm font-semibold">Make it feel like home</div>
                      <div className="text-xs text-black/60 dark:text-white/60">
                        Theme and compact mode are saved to your browser for next time.
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="time">
                    <div className="space-y-3">
                      <div className="text-sm font-semibold">Clock highlights</div>
                      <div className="text-xs text-black/60 dark:text-white/60">
                        Toggle which time zones appear in the World Clock widget.
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <WidgetManagerModal open={widgetManagerOpen} onOpenChange={setWidgetManagerOpen} />
    </>
  );
}

