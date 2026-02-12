import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, WalletCards, Star } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <header className="p-6 text-center">
        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent">
          오늘의 운세
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          오늘의 운세, 타로, 오하아사(별자리 순위)를 한 번에
        </p>
      </header>

      <section className="flex-1 container max-w-2xl mx-auto px-4 pb-8">
        <div className="grid gap-4 md:grid-cols-3">
          <Link href="/start?service=today">
            <Card className="h-full hover:border-violet-300 hover:shadow-md transition-all cursor-pointer">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center mb-2">
                  <Sparkles className="w-6 h-6 text-violet-600" />
                </div>
                <CardTitle className="text-lg">오늘의 운세</CardTitle>
                <CardDescription>생년월일 기반 개인화 운세</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/start?service=tarot">
            <Card className="h-full hover:border-violet-300 hover:shadow-md transition-all cursor-pointer">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-fuchsia-100 flex items-center justify-center mb-2">
                  <WalletCards className="w-6 h-6 text-fuchsia-600" />
                </div>
                <CardTitle className="text-lg">타로</CardTitle>
                <CardDescription>1장 또는 3장 스프레드</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/start?service=ohahasa">
            <Card className="h-full hover:border-violet-300 hover:shadow-md transition-all cursor-pointer">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mb-2">
                  <Star className="w-6 h-6 text-amber-600" />
                </div>
                <CardTitle className="text-lg">오하아사</CardTitle>
                <CardDescription>12별자리 운세 순위</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>

        <div className="mt-8 text-center">
          <Link href="/start">
            <Button size="lg" className="w-full max-w-sm">
              바로 시작하기
            </Button>
          </Link>
        </div>

        <div className="mt-8">
          <Link href="/history" className="text-sm text-muted-foreground hover:underline">
            최근 결과 보기
          </Link>
        </div>
      </section>

      <footer className="p-4 text-center text-xs text-muted-foreground">
        본 서비스는 오락/참고용이며, 과학적 근거가 없습니다.
      </footer>
    </main>
  );
}
