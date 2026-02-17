"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, WalletCards, History, Zap, User, Share2 } from "lucide-react";
import { hasStoredProfile } from "@/lib/profile";

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
    else router.push("/start");
  };

  return (
    <section
      className="pt-16 pb-20 md:pt-20 md:pb-24 px-4"
      style={{ animation: "fade-in-up 0.5s ease-out both" }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* 왼쪽: 타이틀 + 설명 + 배지 + CTA */}
          <div className="text-center lg:text-left">
            <h1 className="text-3xl md:text-4xl lg:text-[2.75rem] font-bold tracking-tight text-foreground">
              <span className="text-indigo-600 dark:text-indigo-400">오늘의 나침반</span>
              <br />
            </h1>
            <p className="mt-4 text-base md:text-lg text-muted-foreground leading-relaxed max-w-md lg:max-w-none mx-auto lg:mx-0">
              생년월일 기반 오늘의 운세, 타로 카드, 12별자리 오하아사 랭킹까지.
              <br />
              입력 한 번으로 매일 다른 결과를 확인하세요.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 justify-center lg:justify-start">
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
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
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
            </div>
          </div>

          {/* 오른쪽: mock 프리뷰 카드 2~3개 겹침 */}
          <div className="relative hidden lg:block min-h-[280px]">
            <div className="absolute right-0 top-0 w-[220px] rounded-2xl border border-border bg-card shadow-md shadow-black/[0.04] p-4 rotate-[-3deg] z-10">
              <div className="flex items-center gap-2 text-sm font-medium text-card-foreground">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                오늘의 운세
              </div>
              <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                오늘은 새로운 만남에 유리한 날. 자신감을 갖고 도전해 보세요.
              </p>
            </div>
            <div className="absolute right-8 top-12 w-[200px] rounded-2xl border border-border bg-card shadow-md shadow-black/[0.04] p-4 rotate-[2deg] z-0">
              <div className="flex items-center gap-2 text-sm font-medium text-card-foreground">
                <WalletCards className="w-4 h-4 text-violet-500" />
                타로
              </div>
              <p className="mt-2 text-xs text-muted-foreground">역방향 · 성찰</p>
            </div>
          </div>

          {/* 모바일: 프리뷰 카드 아래로 */}
          <div className="lg:hidden mt-8 flex flex-col gap-3 max-w-sm mx-auto">
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
