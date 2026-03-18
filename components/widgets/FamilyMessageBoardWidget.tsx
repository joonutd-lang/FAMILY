"use client";

import * as React from "react";
import { useFamilyHubStore } from "@/store/familyHubStore";
import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatDateTimeShort } from "@/lib/utils/time";
import { Pin, PinOff, MessageSquareText } from "lucide-react";

function isRead(messageReadByMember: Record<string, string[]>, memberId: string, postId: string) {
  const read = messageReadByMember[memberId] ?? [];
  return read.includes(postId);
}

export function FamilyMessageBoardWidget() {
  const members = useFamilyHubStore((s) => s.members);
  const activeMemberId = useFamilyHubStore((s) => s.activeMemberId);
  const messages = useFamilyHubStore((s) => s.messages);
  const messageReadByMember = useFamilyHubStore((s) => s.messageReadByMember);

  const togglePinned = useFamilyHubStore((s) => s.togglePinned);
  const markPostReadForActiveMember = useFamilyHubStore((s) => s.markPostReadForActiveMember);
  const markAllReadForActiveMember = useFamilyHubStore((s) => s.markAllReadForActiveMember);
  const addMessagePost = useFamilyHubStore((s) => s.addMessagePost);

  const [content, setContent] = React.useState("");

  const unreadCount = React.useMemo(() => {
    return messages.filter((m) => !isRead(messageReadByMember, activeMemberId, m.id)).length;
  }, [messages, messageReadByMember, activeMemberId]);

  const memberById = React.useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);

  const sorted = React.useMemo(() => {
    return messages
      .slice()
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [messages]);

  const post = () => {
    const clean = content.trim();
    if (!clean) return;
    addMessagePost({
      authorMemberId: activeMemberId,
      content: clean,
      pinned: false,
    });
    setContent("");
  };

  return (
    <CardContent className="h-full">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquareText className="h-4 w-4 text-black/60 dark:text-white/85" />
            <div className="text-sm font-semibold">Message Board</div>
          </div>
          <div className="mt-1 text-xs text-black/60 dark:text-white/85">
            Sticky notes for your family. {unreadCount > 0 ? `${unreadCount} unread` : "All caught up."}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" className="rounded-full" disabled={unreadCount === 0} onClick={() => markAllReadForActiveMember()}>
            Mark all read
          </Button>
        </div>
      </div>

      <Separator className="my-3" />

      <div className="rounded-2xl border border-black/10 bg-white/60 p-3 dark:bg-black/55">
        <div className="text-xs font-semibold text-black/60 dark:text-white/85">Leave a note</div>
        <div className="mt-2 space-y-2">
          <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Type a message… (e.g. snack list, pick-up time, reminders)" />
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-black/60 dark:text-white/85">
              Posted as {memberById.get(activeMemberId)?.name ?? "Member"}
            </div>
            <Button className="rounded-full" onClick={post} disabled={!content.trim()}>
              Post
            </Button>
          </div>
        </div>
      </div>

      <Separator className="my-3" />

      <div className="space-y-2">
        {sorted.map((m) => {
          const author = memberById.get(m.authorMemberId);
          const read = isRead(messageReadByMember, activeMemberId, m.id);
          const created = new Date(m.createdAt);
          return (
            <button
              key={m.id}
              className={`w-full rounded-2xl border p-3 text-left transition-colors ${
                m.pinned
                  ? "border-black/15 bg-amber-100/70 dark:bg-amber-300/15"
                  : "border-black/10 bg-yellow-100/65 dark:bg-yellow-300/10 hover:bg-yellow-100/80 dark:hover:bg-yellow-300/15"
              } ${read ? "opacity-90" : "opacity-100"}`}
              onClick={() => {
                markPostReadForActiveMember(m.id);
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: author?.color ?? "#999" }} />
                    <div className="truncate text-sm font-semibold">{author?.name ?? "Someone"}</div>
                    {!read ? <Badge variant="info">Unread</Badge> : null}
                  </div>
                  <div className="mt-1 text-xs text-black/60 dark:text-white/85">
                    {formatDateTimeShort(created)}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    togglePinned(m.id);
                  }}
                  aria-label={m.pinned ? "Unpin message" : "Pin message"}
                >
                  {m.pinned ? (
                    <Pin className="h-4 w-4 text-black/70 dark:text-white/85" />
                  ) : (
                    <PinOff className="h-4 w-4 text-black/40 dark:text-white/80" />
                  )}
                </Button>
              </div>

              <div className="mt-2 text-sm leading-relaxed">{m.content}</div>

              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="text-xs text-black/60 dark:text-white/85">
                  {m.pinned ? "Pinned" : "Tap to mark read"}
                </div>
                <div className="text-xs text-black/60 dark:text-white/85">{read ? "Read" : "Unread"}</div>
              </div>
            </button>
          );
        })}

        {sorted.length === 0 ? (
          <div className="text-sm text-black/60 dark:text-white/85">No messages yet.</div>
        ) : null}
      </div>
    </CardContent>
  );
}

