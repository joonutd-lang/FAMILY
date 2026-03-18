"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFamilyHubStore } from "@/store/familyHubStore";
import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Plus, ArrowLeft } from "lucide-react";

export default function PackingCheckPage() {
  const router = useRouter();
  const members = useFamilyHubStore((s) => s.members);
  const activeMemberId = useFamilyHubStore((s) => s.activeMemberId);
  const packingItemsByMember = useFamilyHubStore((s) => s.packingItemsByMember);

  const addPackingItem = useFamilyHubStore((s) => s.addPackingItem);
  const togglePackingItemChecked = useFamilyHubStore((s) => s.togglePackingItemChecked);
  const resetPackingForMember = useFamilyHubStore((s) => s.resetPackingForMember);

  const activeMember = members.find((m) => m.id === activeMemberId);
  const items = packingItemsByMember[activeMemberId] ?? [];

  const [newItem, setNewItem] = React.useState("");

  const allDone = items.length > 0 && items.every((it) => it.checkedByMemberIds.includes(activeMemberId));

  const doneCount = items.filter((it) => it.checkedByMemberIds.includes(activeMemberId)).length;

  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 py-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="inline-flex">
            <Button variant="outline" className="rounded-full">
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Button>
          </Link>
          <div>
            <div className="text-lg font-semibold">준비물 챙겼어?</div>
            <div className="text-xs text-black/60 dark:text-white/60">
              {activeMember ? `${activeMember.name} 기준으로 체크해요.` : "가족 구성원 기준"}
            </div>
          </div>
        </div>
        <Badge variant={allDone ? "success" : "default"} className="rounded-full">
          {allDone ? (
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5" />
              All done!
            </span>
          ) : (
            `${doneCount}/${items.length || 0} 완료`
          )}
        </Badge>
      </div>

      <Separator className="my-4" />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="md:col-span-2">
          <CardContent className="p-0">
            <div className="rounded-2xl border border-black/10 bg-white/60 p-4 dark:bg-black/30">
              <div className="text-sm font-semibold">준비물 목록</div>
              <div className="mt-1 text-xs text-black/60 dark:text-white/60">
                아이가 직접 입력하고, 아래에서 체크만 해주세요.
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                <Input
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  placeholder="예: 물병, 도시락, 운동화…"
                />
                <div className="sm:col-span-2 flex gap-2">
                  <Button
                    className="rounded-full"
                    onClick={() => {
                      const label = newItem.trim();
                      if (!label) return;
                      addPackingItem({ memberId: activeMemberId, label });
                      setNewItem("");
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                </div>
              </div>

              <Separator className="my-3" />

              <div className="space-y-2">
                {items.length === 0 ? (
                  <div className="text-sm text-black/60 dark:text-white/60">아직 준비물이 없어요. 위에서 추가해 주세요.</div>
                ) : (
                  items.map((it) => {
                    const checked = it.checkedByMemberIds.includes(activeMemberId);
                    return (
                      <button
                        key={it.id}
                        className="w-full rounded-2xl border border-black/10 bg-white/70 p-3 text-left hover:bg-white/90 dark:bg-black/20 dark:hover:bg-black/10"
                        onClick={() => togglePackingItemChecked({ memberId: activeMemberId, itemId: it.id })}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className={`truncate text-sm font-semibold ${checked ? "opacity-80 line-through" : ""}`}>{it.label}</div>
                            <div className="text-xs text-black/60 dark:text-white/60">
                              {checked ? "챙김" : "아직"}
                            </div>
                          </div>
                          <div className="h-5 w-5 rounded-full border border-black/10 bg-white flex items-center justify-center dark:border-white/10 dark:bg-black/20">
                            {checked ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <span className="block h-2 w-2 rounded-full bg-black/20 dark:bg-white/20" />
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </CardContent>
        </div>

        <div>
          <div className="rounded-2xl border border-black/10 bg-white/60 p-4 dark:bg-black/30">
            <div className="text-sm font-semibold">다음 단계</div>
            <div className="mt-1 text-xs text-black/60 dark:text-white/60">모든 항목이 체크되면 이동할 수 있어요.</div>

            <div className="mt-3 space-y-2">
              <Button
                className="w-full rounded-full"
                disabled={!allDone}
                onClick={() => router.push("/packing-done")}
              >
                집에 나갈 수 있어요
              </Button>
              <Button
                variant="outline"
                className="w-full rounded-full"
                onClick={() => resetPackingForMember(activeMemberId)}
                disabled={items.length === 0}
              >
                체크 초기화
              </Button>
            </div>

            <Separator className="my-3" />

            <div className="text-xs text-black/60 dark:text-white/60">
              Tip: 가족 다른 사람으로 전환하고 싶으면, 대시보드의 상단 탭에서 바꿔주세요.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

