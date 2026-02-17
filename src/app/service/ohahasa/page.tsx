"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { add, sub, format } from "date-fns";
import { ko } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronLeft, ChevronRight, CalendarIcon, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getZodiacFromBirthday } from "@/lib/zodiac";
import { addToHistory } from "@/lib/history";
import { Disclaimer } from "@/components/fortune/Disclaimer";
import { ProfileGate } from "@/components/fortune/ProfileGate";
import { getStoredProfile, getBirthParts } from "@/lib/profile";
import type { OhahasaResponse, OhahasaRankItem } from "@/types/fortune";

function OhahasaContent() {
  const searchParams = useSearchParams();
  const dateParam = searchParams.get("date");
  const [selectedDate, setSelectedDate] = useState(() => {
    if (dateParam) {
      const d = new Date(dateParam);
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
  });
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<OhahasaResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detailSign, setDetailSign] = useState<OhahasaRankItem | null>(null);
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);

  const dateStr = format(selectedDate, "yyyy-MM-dd");

  useEffect(() => {
    const stored = getStoredProfile() as Record<string, unknown> | null;
    if (stored) setProfile(stored);
  }, []);

  const birthParts = getBirthParts(profile);
  const mySign = profile
    ? getZodiacFromBirthday(birthParts.year, birthParts.month, birthParts.day)
    : null;

  useEffect(() => {
    setLoading(true);
    fetch("/api/fortune/ohahasa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: dateStr }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed");
        return res.json();
      })
      .then((json: OhahasaResponse) => {
        setData(json);
        setError(null);
        addToHistory({
          type: "ohahasa",
          title: json.title,
          summary: json.notes,
          payload: json,
        });
      })
      .catch(() => setError("오류가 발생했습니다."))
      .finally(() => setLoading(false));
  }, [dateStr]);

  const handleShare = async () => {
    if (!data) return;
    const res = await fetch("/api/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "ohahasa", payload: data }),
    });
    if (res.ok) {
      const { url } = await res.json();
      await navigator.clipboard.writeText(`${window.location.origin}${url}`);
      alert("링크가 복사되었습니다!");
    } else {
      alert("공유에 실패했습니다.");
    }
  };

  const prevDay = () => setSelectedDate((d) => sub(d, { days: 1 }));
  const nextDay = () => {
    const next = add(selectedDate, { days: 1 });
    if (next <= new Date()) setSelectedDate(next);
  };

  return (
    <main className="min-h-screen container max-w-2xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">오하아사</h1>
        <Button variant="outline" size="icon" onClick={handleShare}>
          <Share2 className="h-4 w-4" />
        </Button>
      </div>

      {/* 날짜 선택 */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <Button variant="outline" size="icon" onClick={prevDay}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex-1">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(selectedDate, "yyyy년 M월 d일", { locale: ko })}
            </Button>
          </PopoverTrigger>
          <PopoverContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d) => d && setSelectedDate(d)}
              locale={ko}
              disabled={(date) => date > new Date()}
            />
          </PopoverContent>
        </Popover>
        <Button
          variant="outline"
          size="icon"
          onClick={nextDay}
          disabled={format(selectedDate, "yyyy-MM-dd") >= format(new Date(), "yyyy-MM-dd")}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {loading && (
        <>
          <Skeleton className="h-8 w-full mb-4" />
          <div className="grid grid-cols-3 gap-2">
            {[...Array(12)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </>
      )}

      {error && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
            <Button
              size="sm"
              className="mt-4"
              onClick={() =>
                fetch("/api/fortune/ohahasa", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ date: dateStr }),
                })
                  .then((r) => r.json())
                  .then((j: OhahasaResponse) => {
                    setData(j);
                    setError(null);
                  })
              }
            >
              다시 시도
            </Button>
          </CardContent>
        </Card>
      )}

      {!loading && data && (
        <>
          <h2 className="text-lg font-semibold text-center mb-4">{data.title}</h2>

          <div className="grid grid-cols-3 gap-2 mb-4">
            {data.ranking.map((r) => {
              const isTop3 = r.rank <= 3;
              const isMySign = mySign && r.sign.slug === mySign.slug;
              return (
                <Card
                  key={r.rank}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    isTop3 && "border-violet-300 bg-violet-50/50",
                    isMySign && "ring-2 ring-amber-400 ring-offset-2"
                  )}
                  onClick={() => setDetailSign(r)}
                >
                  <CardContent className="p-3">
                    <div className="flex justify-between items-center">
                      <Badge
                        variant={isTop3 ? "default" : "secondary"}
                        className={isTop3 ? "bg-violet-600" : ""}
                      >
                        {r.rank}위
                      </Badge>
                      {isMySign && (
                        <span className="text-xs text-amber-600 font-medium">내 별자리</span>
                      )}
                    </div>
                    <p
                      className={cn(
                        "font-medium mt-1",
                        isTop3 && "text-violet-700",
                        isTop3 && "text-base"
                      )}
                    >
                      {r.sign.krName}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                      {r.oneLiner}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {mySign && (
            <Card className="border-amber-200 bg-amber-50/50 mb-4">
              <CardHeader>
                <CardTitle className="text-base">
                  내 별자리 ({mySign.krName}) 오늘 한 줄
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  {data.ranking.find((r) => r.sign.slug === mySign.slug)?.oneLiner ??
                    "오늘의 운세를 확인해 보세요."}
                </p>
              </CardContent>
            </Card>
          )}

          {data.notes && (
            <Card>
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">{data.notes}</p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <Dialog open={!!detailSign} onOpenChange={() => setDetailSign(null)}>
        <DialogContent>
          {detailSign && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {detailSign.sign.krName}자리 ({detailSign.rank}위)
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-2">
                <p>{detailSign.oneLiner}</p>
                <div className="flex flex-wrap gap-1">
                  {detailSign.keywords?.map((k, i) => (
                    <Badge key={i} variant="secondary">
                      {k}
                    </Badge>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">행운의 색</span>
                    <p>{detailSign.lucky?.color}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">행운의 숫자</span>
                    <p>{detailSign.lucky?.number}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium">추천</p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground">
                    {detailSign.do?.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-medium">주의</p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground">
                    {detailSign.dont?.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

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

export default function OhahasaPage() {
  return (
    <ProfileGate>
      <Suspense fallback={
        <main className="min-h-screen container max-w-2xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-48" />
            <div className="grid grid-cols-3 gap-2">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="h-24 bg-muted rounded" />
              ))}
            </div>
          </div>
        </main>
      }>
        <OhahasaContent />
      </Suspense>
    </ProfileGate>
  );
}
