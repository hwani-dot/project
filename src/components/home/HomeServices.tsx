"use client";

import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Sparkles, WalletCards, Star, ArrowRight } from "lucide-react";
import { hasStoredProfile } from "@/lib/profile";

type ServiceSlug = "today" | "tarot" | "ohahasa";

const SERVICE_CONFIG: Record<
  ServiceSlug,
  {
    path: string;
    icon: typeof Sparkles;
    iconBg: string;
    title: string;
    description: string;
    bullets: [string, string];
  }
> = {
  today: {
    path: "/service/today",
    icon: Sparkles,
    iconBg: "bg-indigo-500/10 text-indigo-600 dark:bg-indigo-400/15 dark:text-indigo-400",
    title: "오늘의 운세",
    description: "생년월일 기반 개인화 운세",
    bullets: ["관심사별 맞춤", "짧은 조언"],
  },
  tarot: {
    path: "/service/tarot",
    icon: WalletCards,
    iconBg: "bg-violet-500/10 text-violet-600 dark:bg-violet-400/15 dark:text-violet-400",
    title: "타로",
    description: "1장 또는 3장 스프레드",
    bullets: ["정·역방향 해석", "다음 행동 제안"],
  },
  ohahasa: {
    path: "/service/ohahasa",
    icon: Star,
    iconBg: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-500",
    title: "오하아사",
    description: "12별자리 운세 순위",
    bullets: ["당일 랭킹", "별자리별 한줄"],
  },
};

const cardBase =
  "h-full rounded-2xl border border-border bg-card text-card-foreground shadow-sm " +
  "cursor-pointer select-none transition-all duration-200 ease-out " +
  "hover:-translate-y-0.5 hover:shadow-md hover:shadow-black/[0.04] hover:border-indigo-200/50 " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 " +
  "dark:shadow-black/5 dark:hover:border-indigo-500/20 dark:hover:shadow-indigo-950/5";

function ServiceCard({ service }: { service: ServiceSlug }) {
  const router = useRouter();
  const config = SERVICE_CONFIG[service];
  const Icon = config.icon;

  const handleClick = () => {
    if (hasStoredProfile()) router.push(config.path);
    else router.push(`/start?service=${service}`);
  };

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      className={cardBase}
    >
      <CardHeader className="pb-2">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${config.iconBg}`}
        >
          <Icon className="w-6 h-6" aria-hidden />
        </div>
        <CardTitle className="text-lg font-semibold tracking-tight mt-3 text-card-foreground">
          {config.title}
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground leading-snug">
          {config.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        <ul className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          {config.bullets.map((b) => (
            <li key={b} className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-muted-foreground/60" />
              {b}
            </li>
          ))}
        </ul>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground pt-1">
          바로가기
          <ArrowRight className="w-3.5 h-3.5 opacity-70" />
        </span>
      </CardContent>
    </Card>
  );
}

export function HomeServices() {
  return (
    <section
      className="py-16 md:py-20 px-4"
      style={{ animation: "fade-in-up 0.5s ease-out 0.06s both" }}
    >
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            오늘 뭐 볼까?
          </h2>
          <p className="mt-2 text-sm md:text-base text-muted-foreground max-w-lg mx-auto">
            세 가지 서비스 중 하나를 골라 오늘만의 결과를 확인하세요.
          </p>
        </div>
        <div className="grid gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {(Object.keys(SERVICE_CONFIG) as ServiceSlug[]).map((slug) => (
            <ServiceCard key={slug} service={slug} />
          ))}
        </div>
      </div>
    </section>
  );
}
