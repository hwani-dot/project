"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Disclaimer } from "@/components/fortune/Disclaimer";
import {
  Heart,
  Coins,
  BookOpen,
  Activity,
  Users,
  Sparkles,
  Palette,
  Hash,
  Package,
  Clock,
  AlertTriangle,
  Lightbulb,
} from "lucide-react";
import tarotData from "@/data/tarot.json";
import type {
  TodayFortuneResponse,
  TodayFortuneResult,
  TodayFortuneSharePayload,
  TarotResponse,
  TarotSharePayload,
  TarotCardResult,
  OhahasaResponse,
  OhahasaResult,
  OhahasaItem,
  OhahasaSharePayload,
} from "@/types/fortune";

const TAROT_MAP = Object.fromEntries(
  (tarotData as { id: string; name: string }[]).map((c) => [c.id, c])
) as Record<string, { name: string }>;

function formatTarotCardName(card: TarotCardResult): string {
  const meta = TAROT_MAP[card.id];
  const en = meta?.name ?? card.name;
  return `${card.name} (${en})`;
}

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
    const sharePayload = payload as TodayFortuneSharePayload | TodayFortuneResponse;
    const isNewFormat = "result" in sharePayload && sharePayload.kind === "today";
    const data = isNewFormat
      ? (sharePayload as TodayFortuneSharePayload).result
      : null;
    const legacy = !isNewFormat ? (payload as TodayFortuneResponse) : null;

    const SECTION_CONFIG = [
      { key: "love" as const, label: "연애", icon: Heart },
      { key: "money" as const, label: "금전", icon: Coins },
      { key: "study" as const, label: "학업", icon: BookOpen },
      { key: "health" as const, label: "건강", icon: Activity },
      { key: "relations" as const, label: "대인관계", icon: Users },
    ];

    if (data) {
      const ps = (sharePayload as TodayFortuneSharePayload).profileSnapshot;
      const overview = data.overview ?? data.summary?.join(" ") ?? "";
      const firstSentence = overview.split(/[.!?]/)[0]?.trim();
      const headline =
        data.headline ??
        (firstSentence ? firstSentence + (overview.includes(".") ? "." : "") : null) ??
        "오늘의 총운을 확인해 보세요.";
      const SECTION_ACCENT: Record<string, { bg: string; border: string; iconBg: string }> = {
        love: { bg: "bg-rose-50/80 dark:bg-rose-950/20", border: "border-l-rose-400", iconBg: "bg-rose-100/80 dark:bg-rose-900/30" },
        money: { bg: "bg-amber-50/80 dark:bg-amber-950/20", border: "border-l-amber-400", iconBg: "bg-amber-100/80 dark:bg-amber-900/30" },
        study: { bg: "bg-violet-50/80 dark:bg-violet-950/20", border: "border-l-violet-400", iconBg: "bg-violet-100/80 dark:bg-violet-900/30" },
        health: { bg: "bg-emerald-50/80 dark:bg-emerald-950/20", border: "border-l-emerald-400", iconBg: "bg-emerald-100/80 dark:bg-emerald-900/30" },
        relations: { bg: "bg-indigo-50/80 dark:bg-indigo-950/20", border: "border-l-indigo-400", iconBg: "bg-indigo-100/80 dark:bg-indigo-900/30" },
      };
      return (
        <main className="min-h-screen container max-w-4xl mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight">{headline}</h1>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className="text-sm text-muted-foreground">{data.date}</span>
              <Badge variant="secondary" className="text-xs font-normal">총운</Badge>
            </div>
            {ps && (
              <p className="text-sm text-muted-foreground mt-2">
                {ps.name ?? "방문자"}
                {ps.birth && ` · ${ps.birth}`}
                {ps.interests?.length ? ` · ${ps.interests.join(", ")}` : ""}
              </p>
            )}
          </div>

          {overview && (
            <section className="mb-6">
              <div className="flex gap-4 rounded-xl border border-border/80 bg-card p-5 pl-4 border-l-4 border-l-primary">
                <div className="shrink-0 p-2 rounded-lg bg-primary/10">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <p className="text-[16px] leading-[1.85] text-foreground/90 whitespace-pre-wrap flex-1">
                  {overview}
                </p>
              </div>
            </section>
          )}

          {data.summary?.length > 0 && (
            <div className="mb-6 py-5 border-y border-border/60">
              <p className="text-xs font-medium text-muted-foreground mb-3">한눈에 보기</p>
              <ul className="space-y-2">
                {data.summary.map((s, i) => (
                  <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                    <span className="text-primary">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <section className="mb-6">
            <h2 className="text-lg font-semibold mb-4">카테고리 운세</h2>
            <div className="space-y-4">
              {SECTION_CONFIG.map(({ key, label, icon: Icon }) => {
                const text = data.sections?.[key];
                if (!text) return null;
                const styles = SECTION_ACCENT[key] ?? SECTION_ACCENT.relations;
                return (
                  <Card key={key} className={`border-l-4 ${styles.border} ${styles.bg}`}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${styles.iconBg}`}>
                          <Icon className="h-4 w-4 text-foreground" />
                        </div>
                        {label}
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

          {(data.keywords?.length > 0 || data.lucky) && (
            <div className="mb-6">
              {data.keywords?.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-muted-foreground mb-2">키워드</p>
                  <div className="flex flex-wrap gap-2">
                    {data.keywords.map((kw, i) => (
                      <span key={i} className="inline-flex rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {data.lucky && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-muted-foreground mb-2">행운 요소</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { icon: Palette, label: "색", val: data.lucky.color },
                      { icon: Hash, label: "숫자", val: String(data.lucky.number) },
                      { icon: Package, label: "아이템", val: data.lucky.item },
                      { icon: Clock, label: "시간", val: data.lucky.time },
                    ].map(({ icon: Icon, label, val }) => (
                      <div key={label} className="flex flex-col items-center gap-1 rounded-lg border border-border/80 bg-muted/30 p-3">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{label}</span>
                        <span className="text-sm font-semibold">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 mb-6">
            <Card className="border-amber-300/60 bg-amber-50/60 dark:bg-amber-950/25">
              <CardContent className="pt-4">
                <div className="flex gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-amber-800 dark:text-amber-200 mb-1">주의</p>
                    <p className="text-sm">{data.caution}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-indigo-300/60 bg-indigo-50/60 dark:bg-indigo-950/25">
              <CardContent className="pt-4">
                <div className="flex gap-2">
                  <Lightbulb className="h-5 w-5 text-indigo-600 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-indigo-800 dark:text-indigo-200 mb-1">추천 행동</p>
                    <p className="text-sm">{data.recommendedAction}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Link href="/">
            <Button variant="outline" className="w-full">
              홈으로
            </Button>
          </Link>
          <Disclaimer />
        </main>
      );
    }

    if (legacy) {
      return (
        <main className="min-h-screen container max-w-lg mx-auto px-4 py-8">
          <h1 className="text-xl font-bold mb-4">{legacy.title}</h1>
          <Card>
            <CardHeader>
              <p className="text-sm text-muted-foreground">{legacy.summary}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {legacy.sections?.map((s) => (
                <div key={s.key}>
                  <div className="flex justify-between">
                    <span className="font-medium">{s.label}</span>
                    <Badge variant="secondary">{s.score}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{s.text}</p>
                </div>
              ))}
              <p className="text-center font-medium text-violet-600">{legacy.oneLiner}</p>
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
  }

  if (type === "tarot" && payload) {
    const sharePayload = payload as TarotSharePayload | TarotResponse;
    const isNewFormat = "result" in sharePayload && sharePayload.kind === "tarot";
    const data = isNewFormat ? (sharePayload as TarotSharePayload).result : null;
    const legacy = !isNewFormat ? (payload as TarotResponse) : null;

    const POSITION_LABELS: Record<string, string> = {
      past: "과거",
      present: "현재",
      future: "미래",
    };

    if (data) {
      const ps = (sharePayload as TarotSharePayload).profileSnapshot;
      return (
        <main className="min-h-screen container max-w-4xl mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{data.headline}</h1>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className="text-sm text-muted-foreground">{data.date}</span>
              <Badge variant="secondary" className="text-xs">타로</Badge>
            </div>
            {ps && (
              <p className="text-sm text-muted-foreground mt-2">
                {ps.name ?? "방문자"}
                {ps.birth && ` · ${ps.birth}`}
              </p>
            )}
          </div>

          <p className="text-[15px] leading-[1.8] whitespace-pre-wrap mb-6">{data.summary}</p>

          <section className="mb-6">
            <h2 className="text-lg font-semibold mb-4">카드별 해석</h2>
            <div className="space-y-4">
              {data.cards.map((card, i) => (
                <Card key={i} className="border-l-4 border-l-primary">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="font-semibold">{formatTarotCardName(card)}</span>
                      {card.position && (
                        <Badge variant="outline">{POSITION_LABELS[card.position]}</Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {card.keywords.map((kw, j) => (
                        <span
                          key={j}
                          className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{card.interpretation}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <div className="grid gap-4 sm:grid-cols-2 mb-6">
            <Card className="border-indigo-300/60 bg-indigo-50/60 dark:bg-indigo-950/25">
              <CardContent className="pt-4">
                <div className="flex gap-2">
                  <Lightbulb className="h-5 w-5 text-indigo-600 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-indigo-800 dark:text-indigo-200 mb-1">오늘의 조언</p>
                    <p className="text-sm">{data.advice}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            {data.caution && (
              <Card className="border-amber-300/60 bg-amber-50/60 dark:bg-amber-950/25">
                <CardContent className="pt-4">
                  <div className="flex gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-amber-800 dark:text-amber-200 mb-1">주의</p>
                      <p className="text-sm">{data.caution}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <Link href="/">
            <Button variant="outline" className="w-full">
              홈으로
            </Button>
          </Link>
          <Disclaimer />
        </main>
      );
    }

    if (legacy) {
      return (
        <main className="min-h-screen container max-w-lg mx-auto px-4 py-8">
          <h1 className="text-xl font-bold mb-4">타로</h1>
          <Card>
            <CardContent className="pt-4 space-y-4">
              {legacy.cards?.map((c, i) => (
                <div key={i}>
                  <p className="font-medium mt-1">{c.krName}</p>
                  <p className="text-sm text-muted-foreground">{c.meaning}</p>
                </div>
              ))}
              <p className="text-sm">{legacy.overall}</p>
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
  }

  if (type === "ohahasa" && payload) {
    const sharePayload = payload as OhahasaSharePayload | OhahasaResponse;
    const isNewFormat =
      "kind" in sharePayload &&
      sharePayload.kind === "ohahasa" &&
      "result" in sharePayload;
    const data = isNewFormat
      ? (sharePayload as OhahasaSharePayload).result
      : null;
    const legacy = !isNewFormat ? (payload as OhahasaResponse) : null;

    if (data && data.items?.length) {
      const items = data.items as OhahasaItem[];
      const top3 = items.slice(0, 3);
      const rest = items.slice(3);
      return (
        <main className="min-h-screen relative overflow-hidden">
          <div
            className="fixed inset-0 -z-10 bg-gradient-to-br from-indigo-50/95 via-violet-50/90 to-sky-100/95"
            aria-hidden
          />
          <div
            className="fixed inset-0 -z-10 opacity-[0.15]"
            style={{
              backgroundImage: `radial-gradient(circle at 20% 30%, rgba(139,92,246,0.3) 1px, transparent 1px),
                radial-gradient(circle at 80% 70%, rgba(59,130,246,0.25) 1px, transparent 1px)`,
              backgroundSize: "48px 48px",
            }}
            aria-hidden
          />
          <div className="container max-w-2xl mx-auto px-4 py-8">
            <h1 className="text-xl font-bold text-slate-800 mb-2">{data.title}</h1>
            <p className="text-sm text-muted-foreground mb-4">{data.date}</p>

            <section className="mb-6">
              <h2 className="text-sm font-medium text-slate-600 mb-3">TOP 3</h2>
              <div className="grid grid-cols-3 gap-3">
                {top3.map((it) => (
                  <Card
                    key={it.rank}
                    className="border-white/70 bg-white/50 backdrop-blur-md shadow-lg"
                  >
                    <CardContent className="p-4 text-center">
                      <Badge
                        variant={it.rank <= 2 ? "default" : "secondary"}
                        className={it.rank === 1 ? "bg-amber-500" : it.rank === 3 ? "bg-amber-700 text-amber-100" : ""}
                      >
                        {it.rank}위
                      </Badge>
                      <p className="font-bold text-slate-800 mt-1">{it.sign.krName}자리</p>
                      <p className="text-xs text-slate-600">{it.score}점</p>
                      <div className="flex flex-wrap justify-center gap-1 mt-2">
                        {it.keywords?.slice(0, 2).map((k, j) => (
                          <span key={j} className="text-[10px] px-1.5 py-0.5 rounded bg-white/60">
                            {k}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {it.oneLine}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            <section className="mb-4">
              <h2 className="text-sm font-medium text-slate-600 mb-3">전체 랭킹</h2>
              <div className="grid grid-cols-3 gap-2">
                {rest.map((it) => (
                  <Card key={it.rank} className="border-white/60 bg-white/40 backdrop-blur-sm">
                    <CardContent className="p-3">
                      <div className="flex justify-between">
                        <Badge variant="secondary" className="text-xs">
                          {it.rank}위
                        </Badge>
                        <span className="text-xs font-medium">{it.score}점</span>
                      </div>
                      <p className="font-medium text-slate-800 mt-1 text-sm">{it.sign.krName}</p>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {it.keywords?.slice(0, 2).map((k, j) => (
                          <span key={j} className="text-[10px] px-1.5 py-0.5 rounded bg-white/70">
                            {k}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {it.oneLine}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {data.notes && (
              <Card className="mb-4 border-white/60 bg-white/40 backdrop-blur-sm">
                <CardContent className="pt-4">
                  <p className="text-sm text-slate-600">{data.notes}</p>
                </CardContent>
              </Card>
            )}

            <Link href="/">
              <Button variant="outline" className="w-full border-white/60 bg-white/50">
                홈으로
              </Button>
            </Link>
            <Disclaimer />
          </div>
        </main>
      );
    }

    if (legacy?.ranking) {
      return (
        <main className="min-h-screen container max-w-lg mx-auto px-4 py-8">
          <h1 className="text-xl font-bold mb-4">{legacy.title}</h1>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {legacy.ranking.map((r) => (
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
          {legacy.notes && (
            <Card>
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">{legacy.notes}</p>
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
