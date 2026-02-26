"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Home, Sparkles, WalletCards, Star } from "lucide-react";
import { hasStoredProfile } from "@/lib/profile";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { getHistory, type HistoryItem } from "@/lib/history";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

const TYPE_CONFIG: Record<
  HistoryItem["type"],
  { label: string; icon: typeof Sparkles; path: string }
> = {
  today: { label: "오늘의 운세", icon: Sparkles, path: "/service/today" },
  tarot: { label: "타로", icon: WalletCards, path: "/service/tarot" },
  ohahasa: { label: "오하아사", icon: Star, path: "/service/ohahasa" },
};

function getDetailHref(item: HistoryItem): string {
  if (item.type === "today") return "/service/today?from=history";
  if (item.type === "tarot") return `/service/tarot?from=history&id=${item.id}`;
  const date = (item.payload as { date?: string })?.date;
  return `/service/ohahasa${date ? `?date=${date}&from=history` : "?from=history"}`;
}

export default function MePage() {
  const router = useRouter();
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [recentItems, setRecentItems] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const has = hasStoredProfile();
    setHasProfile(has);
    setRecentItems(getHistory().slice(0, 3));
    if (!has) {
      router.replace("/start?next=/me");
    }
  }, [router]);

  const handleCopyToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  if (hasProfile === null) {
    return (
      <main className="min-h-screen me-page-bg flex items-center justify-center">
        <p className="text-muted-foreground text-sm">로딩 중...</p>
      </main>
    );
  }

  if (!hasProfile) {
    return (
      <main className="min-h-screen me-page-bg flex items-center justify-center">
        <p className="text-muted-foreground text-sm">정보 입력으로 이동 중...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen me-page-bg">
      <div className="container max-w-lg mx-auto px-4 py-8 relative z-10">
        {/* Hero */}
        <header className="me-hero rounded-2xl p-6 mb-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 dark:bg-white/10 flex items-center justify-center">
                <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">내 정보</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  프로필을 수정하면 운세가 더 정확해져요.
                </p>
              </div>
            </div>
            <Link href="/">
              <Button variant="secondary" size="sm" className="gap-1.5 shrink-0">
                <Home className="w-4 h-4" />
                홈으로
              </Button>
            </Link>
          </div>
        </header>

        {/* Profile Card */}
        <div className="mb-8">
          <ProfileCard
            variant="full"
            editNext="/me"
            resetNext="/"
            onCopyToast={handleCopyToast}
          />
        </div>

        {/* 바로가기 */}
        <section className="mb-8">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">바로가기</h3>
          <div className="grid grid-cols-3 gap-3">
            {(Object.entries(TYPE_CONFIG) as [HistoryItem["type"], (typeof TYPE_CONFIG)[HistoryItem["type"]]][]).map(
              ([_, config]) => {
                const Icon = config.icon;
                return (
                  <Link key={config.path} href={config.path}>
                    <Card className="h-full rounded-xl border-border bg-card/80 backdrop-blur-sm hover:bg-card hover:shadow-md transition-all cursor-pointer">
                      <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                        <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <span className="text-sm font-medium">{config.label}</span>
                      </CardContent>
                    </Card>
                  </Link>
                );
              }
            )}
          </div>
        </section>

        {/* 최근 기록 */}
        {recentItems.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-muted-foreground">최근 기록</h3>
              <Link href="/history">
                <Button variant="ghost" size="sm" className="text-xs h-8 text-muted-foreground">
                  전체 보기
                </Button>
              </Link>
            </div>
            <div className="space-y-2">
              {recentItems.map((item) => {
                const config = TYPE_CONFIG[item.type];
                const Icon = config.icon;
                return (
                  <Link key={item.id} href={getDetailHref(item)}>
                    <Card className="rounded-xl border-border bg-card/60 backdrop-blur-sm hover:bg-card/80 transition-all">
                      <CardContent className="p-3 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {config.label} · {format(new Date(item.createdAt), "M.d (E)", { locale: ko })}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl bg-foreground text-background text-sm font-medium shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300">
          {toast}
        </div>
      )}
    </main>
  );
}
