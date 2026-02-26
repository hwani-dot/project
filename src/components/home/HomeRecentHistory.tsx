"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { History, ArrowRight, Sparkles, WalletCards, Star } from "lucide-react";
import { getHistory, type HistoryItem } from "@/lib/history";

const TYPE_CONFIG: Record<
  HistoryItem["type"],
  { label: string; icon: typeof Sparkles; className: string }
> = {
  today: {
    label: "오늘의 운세",
    icon: Sparkles,
    className: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  },
  tarot: {
    label: "타로",
    icon: WalletCards,
    className: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
  ohahasa: {
    label: "오하아사",
    icon: Star,
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-500",
  },
};

function getDetailHref(item: HistoryItem): string {
  if (item.type === "today") return "/service/today?from=history";
  if (item.type === "tarot") return `/service/tarot?from=history&id=${item.id}`;
  const date = (item.payload as { date?: string })?.date;
  return `/service/ohahasa${date ? `?date=${date}&from=history` : "?from=history"}`;
}

export function HomeRecentHistory() {
  const [items, setItems] = useState<HistoryItem[]>([]);

  useEffect(() => {
    setItems(getHistory().slice(0, 3));
  }, []);

  if (items.length === 0) return null;

  return (
    <section
      className="px-4"
      style={{ animation: "fade-in-up 0.5s ease-out 0.1s both" }}
    >
      <div className="max-w-5xl mx-auto rounded-3xl bg-white/60 dark:bg-white/5 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-sm py-10 md:py-14 px-6 md:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">최근 기록</h2>
          <Link href="/history">
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
              전체 보기
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const config = TYPE_CONFIG[item.type];
            const Icon = config.icon;
            return (
              <Link key={item.id} href={getDetailHref(item)}>
                <div className="relative rounded-xl p-[1px] bg-gradient-to-br from-indigo-200/50 via-violet-200/40 to-transparent dark:from-white/10 dark:via-white/5 dark:to-transparent">
                  <Card className="h-full rounded-xl border-0 bg-card shadow-sm hover:-translate-y-0.5 hover:shadow-lg hover:border-indigo-200/50 dark:hover:border-indigo-500/20 transition-all cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${config.className}`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Badge variant="secondary" className="text-xs mb-1">
                          {config.label}
                        </Badge>
                        <p className="font-medium text-sm text-foreground line-clamp-1">{item.title}</p>
                        {item.summary && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                            {item.summary}
                          </p>
                        )}
                        <p className="text-[11px] text-muted-foreground/80 mt-1">
                          {format(new Date(item.createdAt), "M.d (E)", { locale: ko })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
