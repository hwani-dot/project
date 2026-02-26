"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Compass, User, History, LogOut, LogIn } from "lucide-react";
import { clearProfile, hasStoredProfile } from "@/lib/profile";
import { cn } from "@/lib/utils";

function getHeaderStyle(pathname: string) {
  if (pathname.startsWith("/service/today")) {
    return {
      header: "bg-[#faf9fd] dark:bg-[#1a1825] border-indigo-200/50 dark:border-white/10",
      logo: "text-indigo-600 dark:text-indigo-400",
      nav: "hover:bg-indigo-500/10 hover:text-indigo-700 dark:hover:bg-white/10 dark:hover:text-indigo-300",
    };
  }
  if (pathname.startsWith("/service/tarot")) {
    return {
      header: "bg-[#030306] border-white/10",
      logo: "text-indigo-400",
      nav: "text-violet-200/90 hover:bg-white/10 hover:text-violet-100",
    };
  }
  if (pathname.startsWith("/service/ohahasa")) {
    return {
      header: "bg-[#0b1020] border-white/10",
      logo: "text-indigo-400",
      nav: "text-white/90 hover:bg-white/10 hover:text-white",
    };
  }
  return {
    header: "bg-white dark:bg-background border-border",
    logo: "text-indigo-600 dark:text-indigo-400",
    nav: "hover:bg-accent hover:text-accent-foreground",
  };
}

export function HomeHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const style = getHeaderStyle(pathname);
  const isServiceDark = pathname.startsWith("/service/tarot") || pathname.startsWith("/service/ohahasa");

  useEffect(() => {
    setHasProfile(hasStoredProfile());
  }, [pathname]);

  const handleLogout = () => {
    clearProfile();
    setHasProfile(false);
    router.replace("/");
  };

  return (
    <header className={cn("sticky top-0 z-50 w-full border-b", style.header)}>
      <div className="max-w-6xl mx-auto px-4 py-[15px] flex items-center justify-between">
        <Link href="/" className={cn("flex items-center gap-2 shrink-0", isServiceDark ? "text-white/95" : "text-foreground")}>
          <Compass className={cn("w-5 h-5", style.logo)} />
          <span className="font-semibold text-[18px]">오늘의 나침반</span>
        </Link>

        <nav className="flex items-center gap-1 md:gap-2">
          {hasProfile === null ? (
            <>
              <Link href="/start?next=/">
                <Button variant="ghost" size="sm" className={cn("gap-1.5 text-[16px]", isServiceDark ? style.nav : "hover:bg-accent hover:text-accent-foreground")}>
                  <LogIn className="w-4 h-4" />
                  <span>로그인</span>
                </Button>
              </Link>
              <Link href="/history">
                <Button variant="ghost" size="sm" className={cn("gap-1.5 text-[16px]", isServiceDark ? style.nav : "hover:bg-accent hover:text-accent-foreground")}>
                  <History className="w-4 h-4" />
                  <span>히스토리</span>
                </Button>
              </Link>
            </>
          ) : hasProfile ? (
            <>
              <Link href="/me">
                <Button variant="ghost" size="sm" className={cn("gap-1.5 text-[16px]", isServiceDark ? style.nav : "hover:bg-accent hover:text-accent-foreground")}>
                  <User className="w-4 h-4" />
                  <span>내 정보</span>
                </Button>
              </Link>
              <Link href="/history">
                <Button variant="ghost" size="sm" className={cn("gap-1.5 text-[16px]", isServiceDark ? style.nav : "hover:bg-accent hover:text-accent-foreground")}>
                  <History className="w-4 h-4" />
                  <span>히스토리</span>
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                className={cn("gap-1.5 text-[16px]", isServiceDark ? "text-red-300/90 hover:bg-red-500/20 hover:text-red-200" : "hover:bg-destructive/10 hover:text-destructive")}
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4" />
                <span>로그아웃</span>
              </Button>
            </>
          ) : (
            <>
              <Link href="/start?next=/">
                <Button variant="ghost" size="sm" className={cn("gap-1.5 text-[16px]", isServiceDark ? style.nav : "hover:bg-accent hover:text-accent-foreground")}>
                  <LogIn className="w-4 h-4" />
                  <span>로그인</span>
                </Button>
              </Link>
              <Link href="/history">
                <Button variant="ghost" size="sm" className={cn("gap-1.5 text-[16px]", isServiceDark ? style.nav : "hover:bg-accent hover:text-accent-foreground")}>
                  <History className="w-4 h-4" />
                  <span>히스토리</span>
                </Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
