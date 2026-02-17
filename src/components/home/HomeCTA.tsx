"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { History } from "lucide-react";
import { hasStoredProfile } from "@/lib/profile";

const ctaButtonClass =
  "w-full h-12 rounded-2xl font-semibold text-[15px] transition-all duration-200 " +
  "bg-gradient-to-r from-gray-800 to-gray-900 text-white " +
  "hover:from-gray-700 hover:to-gray-800 hover:shadow-md hover:shadow-black/10 " +
  "active:scale-[0.99] " +
  "disabled:opacity-50 disabled:pointer-events-none " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 " +
  "dark:from-indigo-900 dark:to-indigo-950 dark:text-white dark:hover:from-indigo-800 dark:hover:to-indigo-900 dark:disabled:opacity-50";

export function HomeCTA() {
  const router = useRouter();

  const onCtaClick = () => {
    if (hasStoredProfile()) {
      router.push("/service/today");
    } else {
      router.push("/start");
    }
  };

  return (
    <section
      className="mt-8 flex flex-col items-center gap-4 max-w-md mx-auto px-4"
      style={{ animation: "fade-in-up 0.5s ease-out 0.1s both" }}
    >
      <Button onClick={onCtaClick} className={ctaButtonClass} size="lg">
        빠른 시작 (추천)
      </Button>
      <Link
        href="/history"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md px-3 py-2 -m-2 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <History className="w-4 h-4 shrink-0" aria-hidden />
        최근 결과 보기
      </Link>
    </section>
  );
}
