import Link from "next/link";

export function HomeFooter({ className }: { className?: string }) {
  return (
    <footer
      className={`border-t border-border bg-muted/20 dark:bg-muted/5 py-10 md:py-12 px-4 ${className ?? ""}`}
    >
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <p className="font-semibold text-foreground">오늘의 운세</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            오늘의 운세, 타로, 오하아사(별자리 순위)를 한 번에
          </p>
        </div>
        <nav className="flex flex-wrap gap-6 text-sm">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            홈
          </Link>
          <Link
            href="/history"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            최근 결과 보기
          </Link>
          <span className="text-muted-foreground/70">·</span>
          <span className="text-muted-foreground/80 text-xs">
            개인정보 수집 없이 브라우저에만 저장됩니다.
          </span>
        </nav>
      </div>
      <p className="max-w-5xl mx-auto mt-6 pt-6 border-t border-border/50 text-[11px] text-muted-foreground/70 text-center md:text-left">
        본 서비스는 오락/참고용이며, 과학적 근거가 없습니다.
      </p>
    </footer>
  );
}
