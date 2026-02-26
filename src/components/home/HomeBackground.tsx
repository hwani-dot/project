export function HomeBackground() {
  return (
    <div
      className="fixed inset-0 -z-10 min-h-screen overflow-hidden pointer-events-none"
      aria-hidden
    >
      {/* 옅은 그라데이션 배경 */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-violet-50/80 dark:from-background dark:via-background dark:to-background" />

      {/* 라이트: glow blob 2~3개 (은은하게) */}
      <div
        className="absolute -top-40 -left-40 w-[480px] h-[480px] rounded-full blur-[100px] dark:hidden"
        style={{ backgroundColor: "rgb(139 92 246 / 0.06)" }}
      />
      <div
        className="absolute top-1/3 -right-24 w-[360px] h-[360px] rounded-full blur-[90px] dark:hidden"
        style={{ backgroundColor: "rgb(99 102 241 / 0.05)" }}
      />
      <div
        className="absolute -bottom-32 right-1/4 w-[320px] h-[320px] rounded-full blur-[80px] dark:hidden"
        style={{ backgroundColor: "rgb(167 139 250 / 0.04)" }}
      />

      {/* 다크: 블롭 은은하게 */}
      <div
        className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full blur-[90px] hidden dark:block"
        style={{ backgroundColor: "rgb(99 102 241 / 0.04)" }}
      />
      <div
        className="absolute top-0 -right-32 w-[400px] h-[400px] rounded-full blur-[85px] hidden dark:block"
        style={{ backgroundColor: "rgb(96 165 250 / 0.03)" }}
      />
      <div
        className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[500px] h-[280px] rounded-full blur-[100px] hidden dark:block"
        style={{ backgroundColor: "rgb(100 116 139 / 0.04)" }}
      />

      <div className="absolute inset-0 home-bg-noise" />
    </div>
  );
}
