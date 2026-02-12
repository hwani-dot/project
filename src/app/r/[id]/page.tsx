"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Disclaimer } from "@/components/fortune/Disclaimer";
import type { TodayFortuneResponse, TarotResponse, OhahasaResponse } from "@/types/fortune";

export default function SharedResultPage() {
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<string | null>(null);
  const [payload, setPayload] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/share/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => {
        setType(data.type);
        setPayload(data.payload);
      })
      .catch(() => setError("공유된 결과를 찾을 수 없습니다."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen container max-w-lg mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-32 w-full" />
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
            <p className="text-sm text-muted-foreground mt-2">
              공유 링크가 만료되었거나 올바르지 않습니다.
            </p>
            <Link href="/">
              <Button className="mt-4">홈으로</Button>
            </Link>
          </CardContent>
        </Card>
        <Disclaimer />
      </main>
    );
  }

  if (type === "today" && payload) {
    const d = payload as TodayFortuneResponse;
    return (
      <main className="min-h-screen container max-w-lg mx-auto px-4 py-8">
        <h1 className="text-xl font-bold mb-4">{d.title}</h1>
        <Card>
          <CardHeader>
            <p className="text-sm text-muted-foreground">{d.summary}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {d.sections?.map((s) => (
              <div key={s.key}>
                <div className="flex justify-between">
                  <span className="font-medium">{s.label}</span>
                  <Badge variant="secondary">{s.score}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{s.text}</p>
              </div>
            ))}
            <p className="text-center font-medium text-violet-600">{d.oneLiner}</p>
          </CardContent>
        </Card>
        <Link href="/">
          <Button variant="outline" className="w-full mt-4">
            홈으로
          </Button>
        </Link>
        <Disclaimer />
      </main>
    );
  }

  if (type === "tarot" && payload) {
    const d = payload as TarotResponse;
    return (
      <main className="min-h-screen container max-w-lg mx-auto px-4 py-8">
        <h1 className="text-xl font-bold mb-4">타로</h1>
        <Card>
          <CardContent className="pt-4 space-y-4">
            {d.cards?.map((c, i) => (
              <div key={i}>
                <Badge>{c.upright ? "정방향" : "역방향"}</Badge>
                <p className="font-medium mt-1">{c.krName}</p>
                <p className="text-sm text-muted-foreground">{c.meaning}</p>
              </div>
            ))}
            <p className="text-sm">{d.overall}</p>
          </CardContent>
        </Card>
        <Link href="/">
          <Button variant="outline" className="w-full mt-4">
            홈으로
          </Button>
        </Link>
        <Disclaimer />
      </main>
    );
  }

  if (type === "ohahasa" && payload) {
    const d = payload as OhahasaResponse;
    return (
      <main className="min-h-screen container max-w-lg mx-auto px-4 py-8">
        <h1 className="text-xl font-bold mb-4">{d.title}</h1>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {d.ranking?.map((r) => (
            <Card key={r.rank}>
              <CardContent className="p-3">
                <Badge variant={r.rank <= 3 ? "default" : "secondary"}>
                  {r.rank}위
                </Badge>
                <p className="font-medium mt-1">{r.sign.krName}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {r.oneLiner}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
        {d.notes && (
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">{d.notes}</p>
            </CardContent>
          </Card>
        )}
        <Link href="/">
          <Button variant="outline" className="w-full mt-4">
            홈으로
          </Button>
        </Link>
        <Disclaimer />
      </main>
    );
  }

  return (
    <main className="min-h-screen container max-w-lg mx-auto px-4 py-8">
      <p className="text-muted-foreground">결과를 표시할 수 없습니다.</p>
      <Link href="/">
        <Button variant="outline" className="mt-4">
          홈으로
        </Button>
      </Link>
      <Disclaimer />
    </main>
  );
}
