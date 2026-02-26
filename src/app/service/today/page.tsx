"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Share2,
  Heart,
  Coins,
  BookOpen,
  Activity,
  Users,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Lightbulb,
  Sparkles,
  Palette,
  Hash,
  Package,
  Clock,
  History,
  Home,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { addToHistory } from "@/lib/history";
import { hashString } from "@/lib/seed";
import { Disclaimer } from "@/components/fortune/Disclaimer";
import { ProfileGate } from "@/components/fortune/ProfileGate";
import { getStoredProfile, getBirthParts } from "@/lib/profile";
import type { TodayFortuneResult } from "@/types/fortune";

const SECTION_CONFIG = [
  { key: "love" as const, label: "연애", icon: Heart, accent: "rose" },
  { key: "money" as const, label: "금전", icon: Coins, accent: "amber" },
  { key: "study" as const, label: "학업", icon: BookOpen, accent: "violet" },
  { key: "health" as const, label: "건강", icon: Activity, accent: "emerald" },
  { key: "relations" as const, label: "대인관계", icon: Users, accent: "indigo" },
];

const ACCENT_STYLES: Record<string, { bg: string; border: string; iconBg: string }> = {
  rose: { bg: "bg-rose-50/80 dark:bg-rose-950/20", border: "border-l-rose-400", iconBg: "bg-rose-100/80 dark:bg-rose-900/30" },
  amber: { bg: "bg-amber-50/80 dark:bg-amber-950/20", border: "border-l-amber-400", iconBg: "bg-amber-100/80 dark:bg-amber-900/30" },
  violet: { bg: "bg-violet-50/80 dark:bg-violet-950/20", border: "border-l-violet-400", iconBg: "bg-violet-100/80 dark:bg-violet-900/30" },
  emerald: { bg: "bg-emerald-50/80 dark:bg-emerald-950/20", border: "border-l-emerald-400", iconBg: "bg-emerald-100/80 dark:bg-emerald-900/30" },
  indigo: { bg: "bg-indigo-50/80 dark:bg-indigo-950/20", border: "border-l-indigo-400", iconBg: "bg-indigo-100/80 dark:bg-indigo-900/30" },
};

function getCategoryScore(seed: string): { stars: number; label: string } {
  const h = hashString(seed) % 5;
  const stars = h + 1;
  const labels = ["주의", "보통", "보통", "좋음", "좋음"];
  return { stars, label: labels[h] ?? "보통" };
}

function HeadlineText({ text }: { text: string }) {
  const parts = text.split(/(총운|금상첨화|무난|양호|순조|좋은|좋음)/);
  return (
    <>
      {parts.map((p, i) => {
        if (["총운", "금상첨화", "무난", "양호", "순조", "좋은", "좋음"].includes(p)) {
          return <span key={i} className="text-primary font-bold">{p}</span>;
        }
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}

function formatBirthDisplay(profile: Record<string, unknown>): string {
  const { year, month, day } = getBirthParts(profile);
  return `${year}년 ${month}월 ${day}일`;
}

function TodayPageContent() {
  const searchParams = useSearchParams();
  const fromHistory = searchParams.get("from") === "history";
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TodayFortuneResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [overviewExpanded, setOverviewExpanded] = useState(false);
  const [overviewNeedsExpand, setOverviewNeedsExpand] = useState(false);
  const overviewRef = useRef<HTMLDivElement>(null);

  const interests = (profile?.interests as string[] | undefined) ?? [];

  useEffect(() => {
    const stored = getStoredProfile() as Record<string, unknown> | null;
    if (stored) setProfile(stored);

    (async () => {
      const p = stored ?? {};
      const { year, month, day } = getBirthParts(p);
      const birth = (p.birth as string) ?? `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

      const payload: Record<string, unknown> = {
        name: (p.name as string) ?? (p.nickname as string) ?? "방문자",
        birth,
        birthYear: year,
        birthMonth: month,
        birthDay: day,
        interests: p.interests ?? [],
        relation: p.relation,
        calendarType: p.calendarType ?? "solar",
      };
      if (p.birthTime) payload.birthTime = p.birthTime;

      const res = await fetch("/api/fortune/today", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error ?? "오류가 발생했습니다.");
        setLoading(false);
        return;
      }

      const json = (await res.json()) as TodayFortuneResult;
      setData(json);

      addToHistory({
        type: "today",
        title: json.title,
        summary: json.overview ?? json.summary?.[0] ?? json.date,
        payload: json,
      });
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!data?.overview) return;
    const el = overviewRef.current;
    if (!el) return;
    const check = () => {
      if (overviewExpanded) {
        setOverviewNeedsExpand(true);
      } else {
        setOverviewNeedsExpand(el.scrollHeight > el.clientHeight);
      }
    };
    check();
    const t = setTimeout(check, 100);
    return () => clearTimeout(t);
  }, [data?.overview, overviewExpanded]);

  const handleShare = async () => {
    if (!data || !profile) return;
    const { year, month, day } = getBirthParts(profile);
    const birth = (profile.birth as string) ?? `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const sharePayload = {
      kind: "today" as const,
      date: data.date,
      profileSnapshot: {
        name: (profile.name as string) ?? (profile.nickname as string) ?? "방문자",
        birth,
        interests: profile.interests as string[] | undefined,
      },
      result: data,
    };
    const res = await fetch("/api/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "today", payload: sharePayload }),
    });
    if (res.ok) {
      const { url } = await res.json();
      await navigator.clipboard.writeText(`${window.location.origin}${url}`);
      alert("링크가 복사되었습니다!");
    } else {
      alert("공유에 실패했습니다.");
    }
  };

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    window.location.reload();
  };

  if (loading) {
    return (
      <main className="today-page min-h-screen">
        <div className="relative z-10 container max-w-4xl mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-5 w-64 mb-6" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4 mb-6" />
        <Skeleton className="h-32 w-full rounded-xl mb-6" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <Disclaimer />
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="today-page min-h-screen">
        <div className="relative z-10 container max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
            <Button size="sm" className="mt-4" onClick={handleRetry}>
              다시 시도
            </Button>
          </CardContent>
        </Card>
        <Disclaimer />
        </div>
      </main>
    );
  }

  if (!data) return null;

  const overview = data.overview ?? data.summary?.join(" ") ?? "";
  const firstSentence = overview.split(/[.!?]/)[0]?.trim();
  const headline =
    data.headline ??
    (firstSentence ? firstSentence + (overview.includes(".") ? "." : "") : null) ??
    "오늘의 총운을 확인해 보세요.";
  const seed = `${data.date}-${profile ? getBirthParts(profile).year : ""}-${data.title}`;

  return (
    <main className="today-page min-h-screen">
      <div className="relative z-10 container max-w-4xl mx-auto px-4 py-8">
      {/* (A) 총운 헤드라인 - 최상단 */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight text-foreground">
          <HeadlineText text={headline} />
        </h1>
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span className="text-sm text-muted-foreground">{data.date}</span>
          <Badge variant="secondary" className="text-xs font-normal">
            총운
          </Badge>
        </div>
        <div className="mt-3 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      </div>

      {/* 상단 헤더: 제목/프로필 + 히스토리/홈/공유 */}
      <div className="flex justify-between items-start mb-10">
        <div>
          <h2 className="text-lg font-semibold text-muted-foreground">{data.title}</h2>
          {profile && (
            <p className="text-sm text-muted-foreground mt-1">
              {(profile.name as string) ?? (profile.nickname as string) ?? "방문자"} · {formatBirthDisplay(profile)}
              {interests.length > 0 && ` · ${interests.join(", ")}`}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {fromHistory && (
            <Link href="/history">
              <Button variant="outline" size="icon">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </Link>
          )}
          <Link href="/history">
            <Button variant="outline" size="icon">
              <History className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" size="icon">
              <Home className="h-4 w-4" />
            </Button>
          </Link>
          <Button variant="outline" size="icon" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* (B) 총운 카드 - 글래스 패널 */}
      <section className="mt-10">
        <div className="today-glass flex gap-4 rounded-xl p-5 pl-4 border-l-4 border-l-primary">
          <div className="shrink-0 p-2 rounded-lg bg-primary/10">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div
              ref={overviewRef}
              className={cn(
                "overflow-hidden transition-all duration-300 text-[16px] leading-[1.85] text-foreground/90 whitespace-pre-wrap",
                !overviewExpanded && "max-h-[17.5rem]"
              )}
            >
              {overview}
            </div>
            {overviewNeedsExpand && (
              <Button
                variant="secondary"
                size="sm"
                className="mt-3 h-8 rounded-full px-4 text-xs"
                onClick={() => setOverviewExpanded(!overviewExpanded)}
              >
                {overviewExpanded ? (
                  <>
                    <ChevronUp className="h-3.5 w-3.5 mr-1.5" />
                    접기
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3.5 w-3.5 mr-1.5" />
                    더보기
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* 3줄 요약 (보조) */}
      {data.summary?.length > 0 && (
        <div className="today-glass mt-10 rounded-xl py-5 px-5">
          <p className="text-xs font-medium text-muted-foreground mb-3">한눈에 보기</p>
          <ul className="space-y-2">
            {data.summary.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                <span className="text-primary font-medium">•</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* (C) 카테고리 운세 5개 */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold mb-1">카테고리 운세</h2>
        <p className="text-sm text-muted-foreground mb-4">연애, 금전, 학업, 건강, 대인관계</p>
        <div className="space-y-4">
          {SECTION_CONFIG.map(({ key, label, icon: Icon, accent }) => {
            const text = data.sections?.[key];
            if (!text) return null;
            const interestMap: Record<string, string> = {
              love: "연애",
              money: "금전",
              study: "학업",
              health: "건강",
              relations: "대인관계",
            };
            const isInterest = interests.some((i) => interestMap[key] === i);
            const styles = ACCENT_STYLES[accent] ?? ACCENT_STYLES.indigo;
            const { stars, label: scoreLabel } = getCategoryScore(seed + key);
            return (
              <Card
                key={key}
                className={cn(
                  "today-glass border-l-4 border-0 shadow-sm",
                  styles.border,
                  styles.bg,
                  isInterest && "ring-2 ring-primary/30 ring-offset-2"
                )}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2 font-semibold flex-wrap">
                    <div className={cn("p-1.5 rounded-lg", styles.iconBg)}>
                      <Icon className="h-4 w-4 text-foreground" />
                    </div>
                    {label}
                    <Badge variant="outline" className="text-xs font-normal ml-1">
                      {scoreLabel} ★{stars}
                    </Badge>
                    {isInterest && (
                      <Badge variant="default" className="text-xs">
                        추천
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-[15px] leading-[1.75] text-foreground/90">{text}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* 오늘의 포인트 - 키워드, 행운, 주의, 추천 */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold mb-1">오늘의 포인트</h2>
        <p className="text-sm text-muted-foreground mb-4">키워드, 행운 요소, 주의사항, 추천 행동</p>

        <div className="grid gap-4 sm:grid-cols-2">
          {data.keywords?.length > 0 && (
            <div className="today-glass rounded-xl p-4 sm:col-span-2">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-primary shrink-0" />
                <p className="text-xs font-medium text-muted-foreground">키워드</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {data.keywords.map((kw, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {data.lucky && (
            <div className="today-glass rounded-xl p-4 sm:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <Palette className="h-4 w-4 text-primary shrink-0" />
                <p className="text-xs font-medium text-muted-foreground">행운 요소</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { icon: Palette, label: "색", val: data.lucky.color },
                  { icon: Hash, label: "숫자", val: String(data.lucky.number) },
                  { icon: Package, label: "아이템", val: data.lucky.item },
                  { icon: Clock, label: "시간", val: data.lucky.time },
                ].map(({ icon: Icon, label, val }) => (
                  <div
                    key={label}
                    className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/20 dark:bg-white/5 p-3"
                  >
                    <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <span className="text-xs text-muted-foreground block">{label}</span>
                      <span className="text-sm font-semibold text-foreground">{val}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Card className="today-glass border-amber-300/50 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800/30 shadow-sm">
            <CardContent className="pt-4">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-amber-800 dark:text-amber-200 mb-1">주의</p>
                  <p className="text-sm text-foreground/90">{data.caution}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="today-glass border-indigo-300/50 bg-indigo-50/50 dark:bg-indigo-950/20 dark:border-indigo-800/30 shadow-sm">
            <CardContent className="pt-4">
              <div className="flex gap-3">
                <Lightbulb className="h-5 w-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-indigo-800 dark:text-indigo-200 mb-1">추천 행동</p>
                  <p className="text-sm text-foreground/90">{data.recommendedAction}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Disclaimer />
      </div>
    </main>
  );
}

export default function TodayPage() {
  return (
    <ProfileGate>
      <Suspense fallback={null}>
        <TodayPageContent />
      </Suspense>
    </ProfileGate>
  );
}
