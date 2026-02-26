"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Home, ArrowUpToLine } from "lucide-react";
import { getHistory, removeFromHistory, type HistoryItem } from "@/lib/history";
import { Disclaimer } from "@/components/fortune/Disclaimer";

export default function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [showFab, setShowFab] = useState(false);

  useEffect(() => {
    setItems(getHistory());
  }, []);

  useEffect(() => {
    const onScroll = () => setShowFab(window.scrollY >= 200);
    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const typeLabel = (t: HistoryItem["type"]) => {
    if (t === "today") return "오늘의 운세";
    if (t === "tarot") return "타로";
    return "오하아사";
  };

  return (
    <main className="min-h-screen container max-w-lg mx-auto px-4 pb-8">
      {/* Sticky 헤더 */}
      <header className="sticky top-0 z-50 -mx-4 px-4 py-3 mb-4 bg-background/80 backdrop-blur-md border-b">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">히스토리</h1>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={scrollToTop} className="shrink-0" title="맨 위로">
              <ArrowUpToLine className="h-4 w-4" />
            </Button>
            <Link href="/">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Home className="h-4 w-4" />
                홈
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {items.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">최근 결과가 없습니다.</p>
            <Link href="/">
              <Button className="w-full mt-4">홈으로</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="pt-4">
                <div className="flex justify-between items-start">
                  <div>
                    <Badge variant="secondary" className="mb-1">
                      {typeLabel(item.type)}
                    </Badge>
                    <p className="font-medium">{item.title}</p>
                    {item.summary && (
                      <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                        {item.summary}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(item.createdAt), "PPp", { locale: ko })}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Link
                      href={
                        item.type === "today"
                          ? "/service/today?from=history"
                          : item.type === "tarot"
                            ? `/service/tarot?from=history&id=${item.id}`
                            : (() => {
                                const date = (item.payload as { date?: string })?.date;
                                return `/service/ohahasa${date ? `?date=${date}&from=history` : "?from=history"}`;
                              })()
                      }
                    >
                      <Button size="sm" variant="outline">
                        보기
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-muted-foreground"
                      onClick={() => {
                        removeFromHistory(item.id);
                        setItems(getHistory());
                      }}
                    >
                      삭제
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Disclaimer />

      {/* FAB: 맨 위로 (스크롤 200px 이상 시 표시) */}
      {showFab && (
        <button
          type="button"
          onClick={scrollToTop}
          className="fixed bottom-8 right-6 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          title="맨 위로"
        >
          <ArrowUpToLine className="h-5 w-5" />
        </button>
      )}
    </main>
  );
}
