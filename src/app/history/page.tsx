"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { getHistory, removeFromHistory, type HistoryItem } from "@/lib/history";
import { Disclaimer } from "@/components/fortune/Disclaimer";

export default function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);

  useEffect(() => {
    setItems(getHistory());
  }, []);

  const typeLabel = (t: HistoryItem["type"]) => {
    if (t === "today") return "오늘의 운세";
    if (t === "tarot") return "타로";
    return "오하아사";
  };

  return (
    <main className="min-h-screen container max-w-lg mx-auto px-4 py-8">
      <h1 className="text-xl font-bold mb-4">최근 결과</h1>

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
                          ? "/service/today"
                          : item.type === "tarot"
                            ? "/service/tarot"
                            : `/service/ohahasa${(item.payload as { date?: string })?.date ? `?date=${(item.payload as { date: string }).date}` : ""}`
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

      <div className="mt-4">
        <Link href="/">
          <Button variant="outline" className="w-full">
            홈으로
          </Button>
        </Link>
      </div>
      <Disclaimer />
    </main>
  );
}
