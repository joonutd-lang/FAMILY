"use client";

import * as React from "react";
import Link from "next/link";
import { useFamilyHubStore } from "@/store/familyHubStore";
import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ArrowLeft, RotateCcw } from "lucide-react";

export default function PackingDonePage() {
  const members = useFamilyHubStore((s) => s.members);
  const activeMemberId = useFamilyHubStore((s) => s.activeMemberId);
  const packingItemsByMember = useFamilyHubStore((s) => s.packingItemsByMember);
  const resetPackingForMember = useFamilyHubStore((s) => s.resetPackingForMember);

  const activeMember = members.find((m) => m.id === activeMemberId);
  const items = packingItemsByMember[activeMemberId] ?? [];

  const allDone = items.length > 0 && items.every((it) => it.checkedByMemberIds.includes(activeMemberId));
  const doneItems = items.filter((it) => it.checkedByMemberIds.includes(activeMemberId));

  return (
    <div className="mx-auto w-full max-w-[900px] px-4 py-8">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="outline" className="rounded-full">
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Button>
          </Link>
          <div>
            <div className="text-lg font-semibold">나갈 준비 완료!</div>
            <div className="text-xs text-black/60 dark:text-white/60">
              {activeMember ? `${activeMember.name} 덕분에 이제 출발!` : "가족 준비 완료!"}
            </div>
          </div>
        </div>
        <Badge variant={allDone ? "success" : "default"} className="rounded-full">
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {allDone ? "All done" : "진행 중"}
          </span>
        </Badge>
      </div>

      <Separator className="my-4" />

      <CardContent className="p-0">
        <div className="rounded-2xl border border-black/10 bg-white/95 p-5 dark:bg-black/30">
          <div className="text-sm font-semibold">체크된 준비물</div>
          <div className="mt-1 text-xs text-black/60 dark:text-white/60">
            {doneItems.length}/{items.length}개 완료
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {doneItems.length === 0 ? (
              <div className="text-sm text-black/60 dark:text-white/60">아직 체크된 준비물이 없어요.</div>
            ) : (
              doneItems.map((it) => (
                <span
                  key={it.id}
                  className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-700 dark:text-emerald-300"
                >
                  {it.label}
                </span>
              ))
            )}
          </div>

          <Separator className="my-4" />

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Link href="/packing-check">
              <Button className="w-full rounded-full" variant="outline">
                다시 확인하기
              </Button>
            </Link>
            <Button
              className="w-full rounded-full"
              onClick={() => resetPackingForMember(activeMemberId)}
              disabled={items.length === 0}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              다음 외출을 위해 초기화
            </Button>
          </div>
        </div>
      </CardContent>
    </div>
  );
}

