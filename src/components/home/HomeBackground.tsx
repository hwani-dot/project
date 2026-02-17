export function HomeBackground() {
  return (
    <div
      className="fixed inset-0 -z-10 min-h-screen overflow-hidden pointer-events-none"
      aria-hidden
    >
      <div className="absolute inset-0 bg-white dark:bg-background" />

      {/* 라이트: 블롭 3개 (6~10%), blur 크게 */}
      <div
        className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full blur-[90px] dark:hidden"
        style={{ backgroundColor: "rgb(99 102 241 / 0.08)" }}
      />
      <div
        className="absolute top-0 -right-32 w-[400px] h-[400px] rounded-full blur-[85px] dark:hidden"
        style={{ backgroundColor: "rgb(96 165 250 / 0.07)" }}
      />
      <div
        className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[500px] h-[280px] rounded-full blur-[100px] dark:hidden"
        style={{ backgroundColor: "rgb(148 163 184 / 0.06)" }}
      />

      {/* 다크: 블롭 더 은은하게 (중립) */}
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
