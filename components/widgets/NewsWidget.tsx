"use client";

import * as React from "react";
import { useFamilyHubStore } from "@/store/familyHubStore";
import type { NewsCategory } from "@/types/familyHub";
import { CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { newsService } from "@/lib/services/newsService";
import { formatDateTimeShort } from "@/lib/utils/time";
import { Newspaper, Filter } from "lucide-react";

const CATEGORIES: NewsCategory[] = ["Top", "Politics", "Technology", "Sports", "Health", "Entertainment"];

export function NewsWidget() {
  const newsCategory = useFamilyHubStore((s) => s.newsCategory);
  const setNewsCategory = useFamilyHubStore((s) => s.setNewsCategory);

  const { data: items, isLoading, refetch } = useQuery({
    queryKey: ["news:top", newsCategory],
    queryFn: () => newsService.getTopNews(newsCategory),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  return (
    <CardContent className="h-full">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Newspaper className="h-4 w-4 text-black/60 dark:text-white/85" />
            <div className="text-sm font-semibold">Top US News</div>
          </div>
          <div className="mt-1 text-xs text-black/60 dark:text-white/85">Mock headlines with category filter.</div>
        </div>
        <Button variant="ghost" className="rounded-full" onClick={() => refetch()} disabled={isLoading}>
          Refresh
        </Button>
      </div>

      <Separator className="my-3" />

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <Button
            key={c}
            variant={newsCategory === c ? "default" : "ghost"}
            className="rounded-full"
            onClick={() => setNewsCategory(c)}
          >
            {c}
          </Button>
        ))}
      </div>

      <Separator className="my-3" />

      {isLoading ? (
        <div className="text-sm text-black/60 dark:text-white/85">Loading headlines…</div>
      ) : (
        <div className="space-y-2">
          {(items ?? []).map((it) => (
            <button
              key={it.id}
              className="w-full rounded-2xl border border-black/10 bg-white/70 p-3 text-left text-black hover:bg-white/90 dark:bg-black/45 dark:hover:bg-black/30 dark:text-white/85"
              onClick={() => window.open(it.url, "_blank", "noopener,noreferrer")}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-black dark:text-white/85">{it.title}</div>
                  <div className="mt-1 text-xs text-black/60 dark:text-white/85 truncate">
                    {it.source} • {formatDateTimeShort(new Date(it.publishedAt))}
                  </div>
                </div>
                <Badge variant="default" className="bg-black/5 dark:bg-white/15">
                  {it.category}
                </Badge>
              </div>
            </button>
          ))}
          {(items ?? []).length === 0 ? <div className="text-sm text-black/60 dark:text-white/85">No news items.</div> : null}
        </div>
      )}
    </CardContent>
  );
}

