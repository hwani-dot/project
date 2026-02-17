"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Share2 } from "lucide-react";
import { addToHistory } from "@/lib/history";
import { Disclaimer } from "@/components/fortune/Disclaimer";
import { ProfileGate } from "@/components/fortune/ProfileGate";
import type { TarotResponse } from "@/types/fortune";

function TarotPageContent() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TarotResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/fortune/tarot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spread: "one-card" }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error ?? "오류가 발생했습니다.");
        setLoading(false);
        return;
      }

      const json = (await res.json()) as TarotResponse;
      setData(json);

      addToHistory({
        type: "tarot",
        title: json.cards?.[0]?.krName ?? "타로",
        summary: json.overall,
        payload: json,
      });
      setLoading(false);
    })();
  }, []);

  const handleShare = async () => {
    if (!data) return;
    const res = await fetch("/api/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "tarot", payload: data }),
    });
    if (res.ok) {
      const { url } = await res.json();
      await navigator.clipboard.writeText(`${window.location.origin}${url}`);
      alert("링크가 복사되었습니다!");
    } else {
      alert("공유에 실패했습니다.");
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen container max-w-lg mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-48 w-full rounded-xl mb-4" />
        <Skeleton className="h-24 w-full" />
        <Disclaimer />
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen container max-w-lg mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
            <Link href="/start?next=/service/tarot">
              <Button size="sm" className="mt-4">
                다시 시도
              </Button>
            </Link>
          </CardContent>
        </Card>
        <Disclaimer />
      </main>
    );
  }

  if (!data) return null;

  return (
    <main className="min-h-screen container max-w-lg mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">타로</h1>
        <Button variant="outline" size="icon" onClick={handleShare}>
          <Share2 className="h-4 w-4" />
        </Button>
      </div>

      <Card>
        <CardHeader>
          <p className="text-sm text-muted-foreground">{data.question}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {data.cards?.map((c, i) => (
              <div key={i} className="text-center">
                <div className="aspect-[2/3] bg-muted rounded-xl flex items-center justify-center mb-2">
                  <span className="text-sm font-medium">{c.krName}</span>
                </div>
                <Badge variant={c.upright ? "default" : "secondary"}>
                  {c.upright ? "정방향" : "역방향"}
                </Badge>
                <p className="text-sm mt-2 font-medium">{c.meaning}</p>
                <p className="text-xs text-muted-foreground mt-1">{c.advice}</p>
              </div>
            ))}
          </div>

          <div>
            <p className="font-medium mb-1">전체 결론</p>
            <p className="text-sm text-muted-foreground">{data.overall}</p>
          </div>
          <div>
            <p className="font-medium mb-1">다음 행동</p>
            <ul className="list-disc list-inside text-sm text-muted-foreground">
              {data.nextAction?.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="mt-4 flex gap-2">
        <Link href="/start?next=/service/tarot" className="flex-1">
          <Button variant="outline" className="w-full">
            다시 뽑기
          </Button>
        </Link>
        <Link href="/history" className="flex-1">
          <Button variant="outline" className="w-full">
            히스토리
          </Button>
        </Link>
      </div>
      <Disclaimer />
    </main>
  );
}

export default function TarotPage() {
  return (
    <ProfileGate>
      <TarotPageContent />
    </ProfileGate>
  );
}
