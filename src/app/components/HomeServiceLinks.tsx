"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, WalletCards, Star } from "lucide-react";
import { hasStoredProfile } from "@/lib/profile";

type ServiceSlug = "today" | "tarot" | "ohahasa";

const SERVICE_PATH: Record<ServiceSlug, string> = {
  today: "/service/today",
  tarot: "/service/tarot",
  ohahasa: "/service/ohahasa",
};

function useNavigateToService(service: ServiceSlug) {
  const router = useRouter();
  return () => {
    if (hasStoredProfile()) {
      router.push(SERVICE_PATH[service]);
    } else {
      router.push(`/start?service=${service}`);
    }
  };
}

function ServiceCard({
  service,
  icon: Icon,
  iconClassName,
  title,
  description,
}: {
  service: ServiceSlug;
  icon: React.ElementType;
  iconClassName: string;
  title: string;
  description: string;
}) {
  const onClick = useNavigateToService(service);
  return (
    <Card
      className="h-full hover:border-violet-300 hover:shadow-md transition-all cursor-pointer"
      onClick={onClick}
    >
      <CardHeader>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 ${iconClassName}`}>
          <Icon className="w-6 h-6" />
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}

export function HomeServiceLinks() {
  const router = useRouter();

  const onStartClick = () => {
    if (hasStoredProfile()) {
      router.push("/service/today");
    } else {
      router.push("/start");
    }
  };

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        <ServiceCard
          service="today"
          icon={Sparkles}
          iconClassName="bg-violet-100 text-violet-600"
          title="오늘의 운세"
          description="생년월일 기반 개인화 운세"
        />
        <ServiceCard
          service="tarot"
          icon={WalletCards}
          iconClassName="bg-fuchsia-100 text-fuchsia-600"
          title="타로"
          description="1장 또는 3장 스프레드"
        />
        <ServiceCard
          service="ohahasa"
          icon={Star}
          iconClassName="bg-amber-100 text-amber-600"
          title="오하아사"
          description="12별자리 운세 순위"
        />
      </div>

      <div className="mt-8 text-center">
        <Button size="lg" className="w-full max-w-sm" onClick={onStartClick}>
          바로 시작하기
        </Button>
      </div>
    </>
  );
}
