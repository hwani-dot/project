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
  { path: string; icon: typeof Sparkles; iconBg: string; title: string; description: string }
> = {
  today: {
    path: "/service/today",
    icon: Sparkles,
    iconBg: "bg-indigo-500/10 text-indigo-600 dark:bg-indigo-400/15 dark:text-indigo-400",
    title: "오늘의 운세",
    description: "생년월일 기반 개인화 운세",
  },
  tarot: {
    path: "/service/tarot",
    icon: WalletCards,
    iconBg: "bg-violet-500/10 text-violet-600 dark:bg-violet-400/15 dark:text-violet-400",
    title: "타로",
    description: "1장 또는 3장 스프레드",
  },
  ohahasa: {
    path: "/service/ohahasa",
    icon: Star,
    iconBg: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/15 dark:text-amber-500",
    title: "오하아사",
    description: "12별자리 운세 순위",
  },
};

const cardBase =
  "h-full rounded-2xl border border-border bg-card text-card-foreground " +
  "cursor-pointer select-none transition-all duration-200 ease-out " +
  "hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5 hover:border-indigo-200/60 " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 " +
  "dark:hover:border-indigo-500/30 dark:hover:shadow-indigo-950/10";

function ServiceCard({ service }: { service: ServiceSlug }) {
  const router = useRouter();
  const config = SERVICE_CONFIG[service];
  const Icon = config.icon;

  const handleClick = () => {
    if (hasStoredProfile()) {
      router.push(config.path);
    } else {
      router.push(`/start?service=${service}`);
    }
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
          className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${config.iconBg}`}
        >
          <Icon className="w-5 h-5" aria-hidden />
        </div>
        <CardTitle className="text-lg font-semibold tracking-tight mt-3 text-card-foreground">
          {config.title}
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground leading-snug">
          {config.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          바로가기
          <ArrowRight className="w-3.5 h-3.5 opacity-70" />
        </span>
      </CardContent>
    </Card>
  );
}

export function HomeServiceCards() {
  return (
    <section
      className="px-4 pb-6"
      style={{ animation: "fade-in-up 0.5s ease-out 0.08s both" }}
    >
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
        {(Object.keys(SERVICE_CONFIG) as ServiceSlug[]).map((slug) => (
          <ServiceCard key={slug} service={slug} />
        ))}
      </div>
    </section>
  );
}
