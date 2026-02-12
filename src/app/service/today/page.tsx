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
import type { TodayFortuneResponse } from "@/types/fortune";

export default function TodayPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TodayFortuneResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      let profile: { nickname?: string; birthYear?: number; birthMonth?: number; birthDay?: number; interests?: string[] } = {};
      try {
        const raw = localStorage.getItem("fortune-profile");
        if (raw) profile = JSON.parse(raw);
      } catch {}

      const res = await fetch("/api/fortune/today", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: profile.nickname ?? "방문자",
          birthYear: profile.birthYear ?? 2000,
          birthMonth: profile.birthMonth ?? 1,
          birthDay: profile.birthDay ?? 1,
          interests: profile.interests ?? [],
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error ?? "오류가 발생했습니다.");
        setLoading(false);
        return;
      }

      const json = (await res.json()) as TodayFortuneResponse;
      setData(json);

      addToHistory({
        type: "today",
        title: json.title,
        summary: json.oneLiner,
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
      body: JSON.stringify({ type: "today", payload: data }),
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
        <Skeleton className="h-24 w-full mb-4" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
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
            <Link href="/start?service=today">
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
        <h1 className="text-xl font-bold">{data.title}</h1>
        <Button variant="outline" size="icon" onClick={handleShare}>
          <Share2 className="h-4 w-4" />
        </Button>
      </div>

      <Card>
        <CardHeader>
          <p className="text-sm text-muted-foreground">{data.summary}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.sections?.map((s) => (
            <div key={s.key}>
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium">{s.label}</span>
                <Badge variant="secondary">{s.score}</Badge>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-violet-500 rounded-full transition-all"
                  style={{ width: `${s.score}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-1">{s.text}</p>
            </div>
          ))}

          <div className="grid grid-cols-2 gap-2 pt-2">
            <div>
              <p className="text-xs text-muted-foreground">행운의 색</p>
              <p className="font-medium">{data.lucky?.color}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">행운의 숫자</p>
              <p className="font-medium">{data.lucky?.number}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">행운의 아이템</p>
              <p className="font-medium">{data.lucky?.item}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">행운의 장소</p>
              <p className="font-medium">{data.lucky?.place}</p>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-1">추천 행동</p>
            <ul className="list-disc list-inside text-sm text-muted-foreground">
              {data.do?.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sm font-medium mb-1">주의 행동</p>
            <ul className="list-disc list-inside text-sm text-muted-foreground">
              {data.dont?.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          </div>

          <p className="text-center font-medium text-violet-600 py-2">{data.oneLiner}</p>
        </CardContent>
      </Card>

      <div className="mt-4 flex gap-2">
        <Link href="/" className="flex-1">
          <Button variant="outline" className="w-full">
            홈
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
