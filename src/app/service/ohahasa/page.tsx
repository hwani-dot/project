"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { add, sub, format } from "date-fns";
import { ko } from "date-fns/locale";
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
import {
  ChevronLeft,
  ChevronRight,
  CalendarIcon,
  Share2,
  Copy,
  Crown,
  Star,
  TrendingUp,
  TrendingDown,
  Palette,
  Hash,
  Package,
  Clock,
  AlertCircle,
  History,
  Home,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getZodiacFromBirthday } from "@/lib/zodiac";
import { getZodiacIcon } from "@/lib/zodiac-icons";
import { addToHistory } from "@/lib/history";
import { Disclaimer } from "@/components/fortune/Disclaimer";
import { ProfileGate } from "@/components/fortune/ProfileGate";
import { getStoredProfile, getBirthParts } from "@/lib/profile";
import type { OhahasaResult, OhahasaItem, OhahasaSharePayload } from "@/types/fortune";

const BREAKDOWN_LABELS: Record<keyof OhahasaItem["breakdown"], string> = {
  love: "연애",
  money: "금전",
  studyOrCareer: "학업·직장",
  health: "건강",
  relations: "대인관계",
};

function getGradeLabel(score: number): string {
  if (score >= 80) return "좋음";
  if (score >= 60) return "보통";
  return "주의";
}

function getGradeClass(score: number): string {
  if (score >= 80) return "bg-emerald-500/20 text-emerald-700 border-emerald-400/30";
  if (score >= 60) return "bg-slate-500/15 text-slate-600 border-slate-400/25";
  return "bg-amber-500/20 text-amber-700 border-amber-400/30";
}

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
  const [data, setData] = useState<OhahasaResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detailItem, setDetailItem] = useState<OhahasaItem | null>(null);
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const fromHistory = searchParams.get("from") === "history";
  const dateStr = format(selectedDate, "yyyy-MM-dd");

  useEffect(() => {
    const stored = getStoredProfile() as Record<string, unknown> | null;
    if (stored) setProfile(stored);
  }, []);

  const birthParts = getBirthParts(profile);
  const mySign = profile
    ? getZodiacFromBirthday(birthParts.year, birthParts.month, birthParts.day)
    : null;
  const myItem = data?.items.find((i) => i.sign.slug === mySign?.slug) ?? null;

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
      .then((json: OhahasaResult) => {
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

  const handleCopySummary = async () => {
    if (!data || !detailItem) return;
    const deltaStr =
      detailItem.deltaRank != null && detailItem.deltaRank !== 0
        ? detailItem.deltaRank > 0
          ? ` ▲${detailItem.deltaRank}`
          : ` ▼${-detailItem.deltaRank}`
        : "";
    const scoreDeltaStr =
      detailItem.deltaScore != null && detailItem.deltaScore !== 0
        ? detailItem.deltaScore > 0
          ? ` (+${detailItem.deltaScore})`
          : ` (${detailItem.deltaScore})`
        : "";
    const breakdownLines = (
      Object.entries(detailItem.breakdown) as [keyof OhahasaItem["breakdown"], { score: number; comment: string }][]
    ).map(([key, { score }]) => `${BREAKDOWN_LABELS[key]} ${score}(${getGradeLabel(score)})`);
    const luckyTime = detailItem.lucky?.luckyTime ?? detailItem.lucky?.time ?? "-";
    const cautionTime = detailItem.lucky?.cautionTime ?? "-";
    const text = [
      `[${data.date}] ${detailItem.sign.krName}자리 (${detailItem.rank}위, ${detailItem.score}점${deltaStr}${scoreDeltaStr})`,
      `한 문장: ${detailItem.headline ?? detailItem.oneLine}`,
      breakdownLines.join(" / "),
      `행운: 색 ${detailItem.lucky.color}, 숫자 ${detailItem.lucky.number}, 아이템 ${detailItem.lucky.item}, 좋은 시간 ${luckyTime}, 주의 시간 ${cautionTime}`,
    ].join("\n");
    await navigator.clipboard.writeText(text);
    setToast("복사 완료");
    setTimeout(() => setToast(null), 2000);
  };

  const handleShare = async () => {
    if (!data) return;
    const sharePayload: OhahasaSharePayload = {
      kind: "ohahasa",
      date: data.date,
      result: data,
    };
    const res = await fetch("/api/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "ohahasa", payload: sharePayload }),
    });
    if (res.ok) {
      const { url } = await res.json();
      await navigator.clipboard.writeText(`${window.location.origin}${url}`);
      setToast("링크가 복사되었습니다!");
      setTimeout(() => setToast(null), 2500);
    } else {
      setToast("공유에 실패했습니다.");
      setTimeout(() => setToast(null), 2500);
    }
  };

  const prevDay = () => setSelectedDate((d) => sub(d, { days: 1 }));
  const nextDay = () => {
    const next = add(selectedDate, { days: 1 });
    if (next <= new Date()) setSelectedDate(next);
  };

  return (
    <main className="ohahasa-page min-h-screen">
      <div className="relative z-10 container max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-6 sm:py-8">
        {/* 헤더: 타이틀 + 공유 */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold text-white/95">오하아사</h1>
          <div className="flex items-center gap-2">
            {fromHistory && (
              <Link href="/history">
                <Button variant="ghost" size="icon" className="text-white/80 hover:bg-white/10">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </Link>
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={handleShare}
              disabled={!data}
              className="ohahasa-glass border-white/20 text-white/90 hover:bg-white/10"
            >
              <Share2 className="h-4 w-4" />
            </Button>
            <Link href="/history">
              <Button variant="ghost" size="icon" className="text-white/80 hover:bg-white/10">
                <History className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/">
              <Button variant="ghost" size="icon" className="text-white/80 hover:bg-white/10">
                <Home className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* 날짜 선택 */}
        <div className="ohahasa-glass rounded-xl p-2 mb-4">
          <div className="flex items-center justify-between gap-2">
            <Button variant="ghost" size="icon" onClick={prevDay} className="shrink-0 h-9 w-9 text-white/90 hover:bg-white/10">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" className="flex-1 text-white/90 font-medium hover:bg-white/10">
                  <CalendarIcon className="mr-2 h-4 w-4 text-white/70" />
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
              variant="ghost"
              size="icon"
              onClick={nextDay}
              disabled={format(selectedDate, "yyyy-MM-dd") >= format(new Date(), "yyyy-MM-dd")}
              className="shrink-0 h-9 w-9 text-white/90 hover:bg-white/10"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {loading && (
          <>
            <Skeleton className="h-32 w-full rounded-xl mb-6 ohahasa-glass" />
            <Skeleton className="h-40 w-full rounded-xl mb-6 ohahasa-glass" />
            <div className="grid grid-cols-3 lg:grid-cols-4 gap-3">
              {[...Array(12)].map((_, i) => (
                <Skeleton key={i} className="h-36 rounded-xl ohahasa-glass" />
              ))}
            </div>
          </>
        )}

        {error && (
          <div className="ohahasa-glass rounded-xl p-6 mb-6">
            <p className="text-red-300 mb-4">{error}</p>
            <Button
              size="sm"
              className="ohahasa-glass border-white/20 text-white/90 hover:bg-white/10"
              onClick={() =>
                fetch("/api/fortune/ohahasa", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ date: dateStr }),
                })
                  .then((r) => r.json())
                  .then((j: OhahasaResult) => {
                    setData(j);
                    setError(null);
                  })
              }
            >
              다시 시도
            </Button>
          </div>
        )}

        {!loading && data && (
          <>
            <h2 className="text-sm font-medium text-white/70 mb-4">{data.title}</h2>

            {/* 내 별자리 요약 카드 */}
            {mySign && myItem && (
              <div
                className={cn(
                  "ohahasa-glass rounded-xl p-5 mb-6",
                  "sticky top-4 z-20",
                  "ring-1 ring-amber-400/30"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white/95 flex items-center gap-2">
                      <Star className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                      <span className="rounded-full w-7 h-7 flex items-center justify-center shrink-0 bg-white/5 backdrop-blur-sm border border-violet-300/30">
                        {(() => {
                          const Icon = getZodiacIcon(mySign.slug);
                          return <Icon className="h-4 w-4 text-violet-200" />;
                        })()}
                      </span>
                      내 별자리 ({myItem.sign.krName}자리)
                    </p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge className="bg-amber-500/90 text-white text-xs">{myItem.rank}위</Badge>
                      <span className="text-sm font-semibold text-white/90">{myItem.score}점</span>
                      {myItem.deltaRank != null && myItem.deltaRank !== 0 && (
                        <span
                          className={cn(
                            "text-xs font-medium flex items-center gap-0.5",
                            myItem.deltaRank > 0 ? "text-emerald-300" : "text-red-300"
                          )}
                        >
                          {myItem.deltaRank > 0 ? (
                            <TrendingUp className="h-3.5 w-3" />
                          ) : (
                            <TrendingDown className="h-3.5 w-3" />
                          )}
                          {myItem.deltaRank > 0 ? `+${myItem.deltaRank}` : myItem.deltaRank}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-white/80 mt-2">{myItem.oneLine}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {myItem.keywords?.slice(0, 3).map((k, i) => (
                        <span key={i} className="text-xs text-white/60">
                          {k}
                        </span>
                      ))}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3 ohahasa-glass border-white/20 text-white/90 hover:bg-white/10"
                      onClick={() => setDetailItem(myItem)}
                    >
                      상세 보기
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* TOP 3 - 1위 강조 */}
            <section className="mb-6">
              <h3 className="text-sm font-semibold text-white/90 mb-3 flex items-center gap-2">
                <Crown className="h-4 w-4 text-amber-400" />
                TOP 3
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {data.items.slice(0, 3).map((it) => {
                  const Icon = getZodiacIcon(it.sign.slug);
                  const isMySign = mySign?.slug === it.sign.slug;
                  return (
                    <div
                      key={it.rank}
                      className={cn(
                        "ohahasa-glass rounded-xl p-4 cursor-pointer transition-all hover:bg-white/10 border",
                        it.rank === 1
                          ? "border-amber-400/40 ring-1 ring-amber-400/20"
                          : "border-white/10"
                      )}
                      onClick={() => setDetailItem(it)}
                    >
                      <div className="flex justify-between items-start">
                        <Badge
                            className={cn(
                              "text-xs",
                              it.rank === 1 && "bg-amber-500/90",
                              it.rank === 2 && "bg-slate-400/80",
                              it.rank === 3 && "bg-amber-700/80 text-amber-100"
                            )}
                          >
                            {it.rank}위
                          </Badge>
                        {it.rank === 1 && <Crown className="h-6 w-6 text-amber-400 shrink-0" />}
                      </div>
                      <div className="flex justify-center mt-2">
                        <div
                          className={cn(
                            "rounded-full flex items-center justify-center backdrop-blur-sm",
                            it.rank === 1 && "w-12 h-12 bg-amber-500/15 border border-amber-400/40",
                            it.rank === 2 && "w-10 h-10 bg-slate-400/15 border border-slate-300/40",
                            it.rank === 3 && "w-10 h-10 bg-amber-700/20 border border-amber-600/40"
                          )}
                        >
                          <Icon
                            className={cn(
                              "text-white/90",
                              it.rank === 1 && "h-7 w-7 text-amber-200",
                              it.rank === 2 && "h-5 w-5 text-slate-200",
                              it.rank === 3 && "h-5 w-5 text-amber-100/90"
                            )}
                          />
                        </div>
                      </div>
                      <p className="font-bold text-white/95 mt-2 text-center text-sm">
                        {it.sign.krName}자리
                      </p>
                      <p className="text-xs text-white/80 text-center font-medium">{it.score}점</p>
                      <div className="flex flex-wrap justify-center gap-1 mt-1.5">
                        {it.keywords?.slice(0, 2).map((k, j) => (
                          <span key={j} className="text-[10px] text-white/60">
                            {k}
                          </span>
                        ))}
                      </div>
                      {isMySign && (
                        <p className="text-[10px] text-amber-300 font-medium text-center mt-1">내 별자리</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 전체 랭킹 (4~12위) - 데스크탑 4열 */}
            <section>
              <h3 className="text-sm font-semibold text-white/90 mb-3 flex items-center gap-2">
                <Star className="h-4 w-4 text-violet-400" />
                전체 랭킹
              </h3>
              <div className="grid grid-cols-3 lg:grid-cols-4 gap-2">
                {data.items.slice(3).map((it) => {
                  const Icon = getZodiacIcon(it.sign.slug);
                  const isMySign = mySign?.slug === it.sign.slug;
                  return (
                    <div
                      key={it.rank}
                      className={cn(
                        "ohahasa-glass rounded-xl p-3 cursor-pointer transition-all hover:bg-white/10 border border-white/10",
                        isMySign && "ring-2 ring-amber-400/50"
                      )}
                      onClick={() => setDetailItem(it)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <div className="rounded-full w-6 h-6 flex items-center justify-center shrink-0 bg-white/5 backdrop-blur-sm border border-violet-300/20">
                            <Icon className="h-3.5 w-3.5 text-violet-200/90" />
                          </div>
                          <Badge variant="secondary" className="text-[11px] px-1.5 py-0 bg-white/10 text-white/90 border-white/20">
                            {it.rank}위
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          {it.deltaRank != null && it.deltaRank !== 0 && (
                            <span
                              className={cn(
                                "text-[10px] font-medium",
                                it.deltaRank > 0 ? "text-emerald-300" : "text-red-300"
                              )}
                            >
                              {it.deltaRank > 0 ? `▲${it.deltaRank}` : `▼${-it.deltaRank}`}
                            </span>
                          )}
                          <span className="text-[11px] font-semibold text-white/80">{it.score}점</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <p className="font-medium text-white/90 text-sm truncate">{it.sign.krName}자리</p>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {it.keywords?.slice(0, 2).map((k, j) => (
                          <span key={j} className="text-[10px] text-white/60">
                            {k}
                          </span>
                        ))}
                      </div>
                      <p className="text-[10px] text-white/60 line-clamp-2 mt-0.5">{it.oneLine}</p>
                    </div>
                  );
                })}
              </div>
            </section>

            {data.notes && (
              <div className="mt-6 ohahasa-glass rounded-xl p-4">
                <p className="text-sm text-white/75">{data.notes}</p>
              </div>
            )}
          </>
        )}

        {/* 상세 모달 */}
        <Dialog open={!!detailItem} onOpenChange={() => setDetailItem(null)}>
          <DialogContent className="max-w-lg">
            {detailItem && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3 flex-wrap">
                    <div className="rounded-full w-14 h-14 flex items-center justify-center shrink-0 bg-violet-50/90 backdrop-blur-sm border border-violet-200">
                      {(() => {
                        const Icon = getZodiacIcon(detailItem.sign.slug);
                        return <Icon className="h-8 w-8 text-violet-600" />;
                      })()}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span>
                        {detailItem.sign.krName}자리 ({detailItem.rank}위 · {detailItem.score}점)
                      </span>
                      {detailItem.deltaRank != null && detailItem.deltaRank !== 0 && (
                        <span
                          className={cn(
                            "text-sm font-medium",
                            detailItem.deltaRank > 0 ? "text-emerald-600" : "text-red-600"
                          )}
                        >
                          {detailItem.deltaRank > 0 ? `▲${detailItem.deltaRank}` : `▼${-detailItem.deltaRank}`}
                        </span>
                      )}
                      {detailItem.deltaScore != null && detailItem.deltaScore !== 0 && (
                        <span
                          className={cn(
                            "text-xs",
                            detailItem.deltaScore > 0 ? "text-emerald-600" : "text-red-600"
                          )}
                        >
                          ({detailItem.deltaScore > 0 ? "+" : ""}
                          {detailItem.deltaScore})
                        </span>
                      )}
                    </div>
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm font-medium text-slate-700">{detailItem.oneLine}</p>
                  <div className="flex flex-wrap gap-2">
                    {detailItem.keywords?.map((k, i) => (
                      <Badge key={i} variant="secondary">
                        {k}
                      </Badge>
                    ))}
                  </div>

                  {(detailItem.headline || detailItem.overview) && (
                    <div>
                      {detailItem.headline && (
                        <p className="text-base font-bold text-slate-800 mb-2 leading-snug">
                          {detailItem.headline}
                        </p>
                      )}
                      {detailItem.overview && (
                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                          {detailItem.overview}
                        </p>
                      )}
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-semibold text-slate-600 mb-3">분야별 운세</p>
                    <div className="space-y-3">
                      {(Object.entries(detailItem.breakdown) as [keyof OhahasaItem["breakdown"], { score: number; comment: string }][]).map(
                        ([key, { score, comment }]) => (
                          <div key={key}>
                            <div className="flex justify-between items-center text-xs mb-1 gap-2">
                              <span className="font-medium text-slate-600">{BREAKDOWN_LABELS[key]}</span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-violet-600 font-semibold">{score}점</span>
                                <span
                                  className={cn(
                                    "rounded-full px-2 py-0.5 text-[10px] font-medium border",
                                    getGradeClass(score)
                                  )}
                                >
                                  {getGradeLabel(score)}
                                </span>
                              </div>
                            </div>
                            <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-violet-400 to-indigo-400 transition-all"
                                style={{ width: `${score}%` }}
                              />
                            </div>
                            <p className="text-xs text-slate-600 mt-0.5">{comment}</p>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-slate-600 mb-2">행운 요소</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { icon: Palette, label: "색", val: detailItem.lucky.color },
                        { icon: Hash, label: "숫자", val: detailItem.lucky.number },
                        { icon: Package, label: "아이템", val: detailItem.lucky.item },
                        {
                          icon: Clock,
                          label: "좋은 시간",
                          val: detailItem.lucky.luckyTime ?? detailItem.lucky.time ?? "-",
                        },
                        ...(detailItem.lucky.cautionTime
                          ? [
                              {
                                icon: AlertCircle,
                                label: "주의 시간",
                                val: detailItem.lucky.cautionTime,
                              },
                            ]
                          : []),
                      ].map(({ icon: Icon, label, val }) => (
                        <div
                          key={label}
                          className="flex flex-col items-center gap-1 rounded-lg border border-slate-200 bg-slate-50/80 p-3"
                        >
                          <Icon className="h-4 w-4 text-slate-500" />
                          <span className="text-[10px] text-slate-500">{label}</span>
                          <span className="text-sm font-semibold text-slate-700">{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={handleShare}
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      공유하기
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={handleCopySummary}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      요약 복사
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {toast && (
          <div
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl ohahasa-glass border-white/20 text-white/95 text-sm font-medium shadow-xl"
            role="status"
          >
            {toast}
          </div>
        )}

        <Disclaimer />
      </div>
    </main>
  );
}

export default function OhahasaPage() {
  return (
    <ProfileGate>
      <Suspense
        fallback={
          <main className="ohahasa-page min-h-screen">
            <div className="container max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-8">
              <div className="animate-pulse space-y-6">
                <div className="h-10 ohahasa-glass rounded w-48" />
                <div className="h-14 ohahasa-glass rounded-xl" />
                <div className="grid grid-cols-3 lg:grid-cols-4 gap-4">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="h-40 ohahasa-glass rounded-xl" />
                  ))}
                </div>
              </div>
              <Disclaimer />
            </div>
          </main>
        }
      >
        <OhahasaContent />
      </Suspense>
    </ProfileGate>
  );
}
