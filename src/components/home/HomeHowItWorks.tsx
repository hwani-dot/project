"use client";

import { Card, CardContent } from "@/components/ui/card";
import { FileEdit, Sparkles, Share2 } from "lucide-react";

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
  return (
    <section
      className="py-16 md:py-20 px-4 bg-muted/30 dark:bg-muted/10"
      style={{ animation: "fade-in-up 0.5s ease-out 0.1s both" }}
    >
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            사용 방법
          </h2>
          <p className="mt-2 text-sm md:text-base text-muted-foreground max-w-lg mx-auto">
            세 단계로 간단히 이용할 수 있습니다.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <Card
                key={step.title}
                className="rounded-2xl border border-border bg-card shadow-sm hover:shadow-md hover:shadow-black/[0.03] transition-shadow"
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
            );
          })}
        </div>
      </div>
    </section>
  );
}
