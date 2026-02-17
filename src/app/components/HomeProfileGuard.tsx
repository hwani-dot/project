"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { hasStoredProfile } from "@/lib/profile";

interface HomeProfileGuardProps {
  children: React.ReactNode;
}

/**
 * 홈(/)에서 프로필이 없으면 /start?next=/ 로 자동 이동.
 * 첫 방문 시 정보 입력 화면이 곧바로 보이도록 한다.
 */
export function HomeProfileGuard({ children }: HomeProfileGuardProps) {
  const router = useRouter();
  const [showHome, setShowHome] = useState<boolean | null>(null);

  useEffect(() => {
    if (hasStoredProfile()) {
      setShowHome(true);
    } else {
      router.replace("/start?next=/");
    }
  }, [router]);

  if (showHome === null) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-muted-foreground text-sm">프로필 확인 중...</p>
      </main>
    );
  }

  return <>{children}</>;
}
