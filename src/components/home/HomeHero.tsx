"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, WalletCards, History, Zap, User, Share2, ChevronDown } from "lucide-react";
import { hasStoredProfile } from "@/lib/profile";
import { LeaderProfileCard } from "./LeaderProfileCard";

const BADGES = [
  { label: "1분 완성", icon: Zap },
  { label: "개인화", icon: User },
  { label: "공유 가능", icon: Share2 },
];

const ctaPrimaryClass =
  "h-12 px-8 rounded-2xl font-semibold text-[15px] transition-all duration-200 " +
  "bg-gradient-to-r from-gray-800 to-gray-900 text-white " +
  "hover:from-gray-700 hover:to-gray-800 hover:shadow-lg hover:shadow-black/10 " +
  "active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 " +
  "dark:from-indigo-700 dark:to-indigo-800 dark:text-white dark:hover:from-indigo-600 dark:hover:to-indigo-700";

export function HomeHero() {
  const router = useRouter();

  const onPrimaryCta = () => {
    if (hasStoredProfile()) router.push("/service/today");
    else router.push("/start?next=/");
  };

  const scrollToServices = () => {
    document.getElementById("services")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section
      className="pt-8 pb-10 md:pt-10 md:pb-12 px-4"
      style={{ animation: "fade-in-up 0.5s ease-out both" }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-10 items-start">
          {/* 왼쪽: 타이틀 + 설명 + 배지 + CTA */}
          <div className="text-center lg:text-left">
            <h1 className="text-3xl md:text-4xl lg:text-[2.75rem] font-bold tracking-tight text-foreground">
              <span className="text-indigo-600 dark:text-indigo-400">오늘의 나침반</span>
              <br />
            </h1>
            <p className="mt-[20px] text-base md:text-lg text-muted-foreground leading-relaxed max-w-md lg:max-w-none mx-auto lg:mx-0">
              생년월일 기반 오늘의 운세, 타로 카드, 12별자리 오하아사 랭킹까지.
              <br />
              입력 한 번으로 매일 다른 결과를 확인하세요.
            </p>
            <div className="mt-[24px] flex flex-wrap gap-2 justify-center lg:justify-start">
              {BADGES.map(({ label, icon: Icon }) => (
                <Badge
                  key={label}
                  variant="secondary"
                  className="font-medium text-muted-foreground border-border px-3 py-1 rounded-full gap-1.5"
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </Badge>
              ))}
            </div>
            <div className="mt-[28px] flex flex-col sm:flex-row flex-wrap gap-3 justify-center lg:justify-start">
              <Button onClick={onPrimaryCta} className={ctaPrimaryClass} size="lg">
                빠른 시작 (추천)
              </Button>
              <Link href="/history">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-12 px-6 rounded-2xl font-medium gap-2 border-border hover:bg-accent"
                >
                  <History className="w-4 h-4" />
                  최근 결과 보기
                </Button>
              </Link>
              <div className="relative group">
                <span className="absolute -top-2 -right-2 z-10 rounded-full bg-white/90 text-violet-700 border border-violet-200 px-2 py-0.5 text-[10px] font-semibold transition-all duration-200 group-hover:brightness-105">
                  NEW
                </span>
                <Button
                  variant="outline"
                  size="lg"
                  className="relative h-14 px-6 py-3 rounded-full font-semibold text-white gap-2 border-0 shadow-lg shadow-violet-500/25 transition-all duration-200 bg-gradient-to-r from-indigo-600 to-violet-600 hover:shadow-xl hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 active:scale-[0.98] active:shadow-[0_0_24px_rgba(251,191,36,0.6),0_0_48px_rgba(251,191,36,0.25)] active:ring-2 active:ring-amber-400/50 active:ring-offset-2 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2"
                  onClick={scrollToServices}
                >
                  <ChevronDown className="w-4 h-4 transition-transform duration-200 group-hover:translate-y-0.5" />
                  오늘 뭐 볼까?
                </Button>
              </div>
            </div>
          </div>

          {/* 오른쪽: 리더 프로필 카드 */}
          <div className="flex justify-center lg:justify-end">
            <div className="w-full max-w-[325px]">
              <LeaderProfileCard />
            </div>
          </div>

          {/* 모바일: 서비스 프리뷰 카드 (프로필 카드 아래) */}
          <div className="lg:hidden mt-6 flex flex-col gap-3 max-w-sm mx-auto col-span-2">
            <Card className="rounded-2xl border-border shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="font-medium text-sm text-foreground">오늘의 운세</p>
                  <p className="text-xs text-muted-foreground">개인화된 일일 운세</p>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-border shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-violet-500/10 flex items-center justify-center">
                  <WalletCards className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <p className="font-medium text-sm text-foreground">타로</p>
                  <p className="text-xs text-muted-foreground">1장·3장 스프레드</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
