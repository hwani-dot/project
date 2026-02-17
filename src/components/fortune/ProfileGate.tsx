"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { hasStoredProfile } from "@/lib/profile";

interface ProfileGateProps {
  children: React.ReactNode;
}

/**
 * 서비스 페이지에서 프로필이 없으면 /start?next=현재경로 로 리다이렉트하는 가드.
 * 클라이언트에서만 localStorage를 읽으므로 이 컴포넌트로 감싸서 사용한다.
 */
export function ProfileGate({ children }: ProfileGateProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    if (hasStoredProfile()) {
      setAllowed(true);
    } else {
      const next = encodeURIComponent(pathname ?? "/");
      router.replace(`/start?next=${next}`);
      setAllowed(false);
    }
  }, [pathname, router]);

  if (allowed === null || allowed === false) {
    return (
      <main className="min-h-screen container max-w-lg mx-auto px-4 py-8 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground text-sm">프로필 확인 중...</div>
      </main>
    );
  }

  return <>{children}</>;
}
