"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileEdit, Sparkles, Share2, ChevronDown } from "lucide-react";
import { hasStoredProfile } from "@/lib/profile";

const STEPS = [
  {
    icon: FileEdit,
    title: "정보 입력",
    description: "이름, 생년월일 등 한 번만 입력하면 저장됩니다.",
    iconBg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  },
  {
    icon: Sparkles,
    title: "생성",
    description: "오늘의 운세·타로·오하아사 중 선택해 결과를 생성하세요.",
    iconBg: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
  {
    icon: Share2,
    title: "저장·공유",
    description: "결과는 자동 저장되고, 링크로 친구에게 공유할 수 있어요.",
    iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-500",
  },
];

export function HomeHowItWorks() {
  const router = useRouter();

  const handleCta = () => {
    if (hasStoredProfile()) {
      document.getElementById("services")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      router.push(`/start?next=${encodeURIComponent("/#services")}`);
    }
  };

  return (
    <section
      className="px-4"
      style={{ animation: "fade-in-up 0.5s ease-out 0.1s both" }}
    >
      <div className="max-w-5xl mx-auto rounded-3xl bg-white/60 dark:bg-white/5 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-sm py-10 md:py-14 px-6 md:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            사용 방법
          </h2>
          <p className="mt-2 text-sm md:text-base text-muted-foreground max-w-lg mx-auto">
            세 단계로 간단히 이용할 수 있습니다.
          </p>
          <Button
            variant="outline"
            size="lg"
            className="mt-6 h-12 px-6 rounded-2xl font-semibold gap-2 border-indigo-200/60 dark:border-indigo-500/30 bg-gradient-to-r from-indigo-50/80 to-violet-50/60 dark:from-indigo-950/30 dark:to-violet-950/20 hover:from-indigo-100 hover:to-violet-100 dark:hover:from-indigo-900/40 dark:hover:to-violet-900/30"
            onClick={handleCta}
          >
            <ChevronDown className="w-4 h-4" />
            3단계로 시작하기
          </Button>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="relative rounded-2xl p-[1px] bg-gradient-to-br from-indigo-200/40 via-violet-200/30 to-transparent dark:from-white/10 dark:via-white/5 dark:to-transparent">
              <Card
                className="rounded-2xl border-0 bg-card shadow-sm hover:-translate-y-0.5 hover:shadow-lg transition-all"
              >
                <CardContent className="pt-6 pb-6">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${step.iconBg}`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <p className="mt-4 font-semibold text-foreground">{step.title}</p>
                  <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </CardContent>
              </Card>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
