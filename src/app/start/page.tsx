"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserProfile } from "@/types/fortune";

const INTERESTS = ["연애", "금전", "학업", "건강", "대인관계"];

function StartContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const service = searchParams.get("service") ?? "today";

  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    nickname: "",
    gender: "",
    birthYear: new Date().getFullYear() - 20,
    birthMonth: 1,
    birthDay: 1,
    interests: [],
  });

  const [birthDate, setBirthDate] = useState<Date | undefined>(
    new Date(profile.birthYear ?? 2000, (profile.birthMonth ?? 1) - 1, profile.birthDay ?? 1)
  );

  useEffect(() => {
    if (birthDate) {
      setProfile((p) => ({
        ...p,
        birthYear: birthDate.getFullYear(),
        birthMonth: birthDate.getMonth() + 1,
        birthDay: birthDate.getDate(),
      }));
    }
  }, [birthDate]);

  const handleSubmit = () => {
    const p: UserProfile = {
      nickname: profile.nickname || "방문자",
      birthYear: profile.birthYear ?? 2000,
      birthMonth: profile.birthMonth ?? 1,
      birthDay: profile.birthDay ?? 1,
      gender: profile.gender || undefined,
      interests: profile.interests,
    };
    if (typeof window !== "undefined") {
      localStorage.setItem("fortune-profile", JSON.stringify(p));
    }
    if (service === "today") router.push("/service/today");
    else if (service === "tarot") router.push("/service/tarot");
    else if (service === "ohahasa") router.push("/service/ohahasa");
    else router.push("/service/today");
  };

  return (
    <main className="min-h-screen container max-w-md mx-auto px-4 py-8">
      <h1 className="text-xl font-bold text-center mb-6">정보 입력</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {service === "today" && "오늘의 운세"}
            {service === "tarot" && "타로"}
            {service === "ohahasa" && "오하아사"}
          </CardTitle>
          <CardDescription>
            {service === "ohahasa" ? "생일로 본인 별자리를 자동 계산합니다." : "개인화된 운세를 위해 아래 정보를 입력해 주세요."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>닉네임</Label>
            <Input
              placeholder="닉네임 (선택)"
              value={profile.nickname}
              onChange={(e) => setProfile((p) => ({ ...p, nickname: e.target.value }))}
            />
          </div>
          <div>
            <Label>성별</Label>
            <Select
              value={profile.gender}
              onValueChange={(v) => setProfile((p) => ({ ...p, gender: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="선택 (선택)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">남성</SelectItem>
                <SelectItem value="female">여성</SelectItem>
                <SelectItem value="other">기타</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>생년월일</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !birthDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {birthDate ? format(birthDate, "PPP", { locale: ko }) : "날짜 선택"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={birthDate}
                  onSelect={setBirthDate}
                  locale={ko}
                  disabled={(date) => date > new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>
          {service === "today" && (
            <div>
              <Label>관심사</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {INTERESTS.map((x) => (
                  <Button
                    key={x}
                    variant={profile.interests?.includes(x) ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      const cur = profile.interests ?? [];
                      const next = cur.includes(x) ? cur.filter((c) => c !== x) : [...cur, x];
                      setProfile((p) => ({ ...p, interests: next }));
                    }}
                  >
                    {x}
                  </Button>
                ))}
              </div>
            </div>
          )}
          <Button className="w-full mt-4" onClick={handleSubmit}>
            생성하기
          </Button>
        </CardContent>
      </Card>

      <div className="mt-4 text-center">
        <Link href="/" className="text-sm text-muted-foreground hover:underline">
          홈으로
        </Link>
      </div>
    </main>
  );
}

export default function StartPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen container max-w-md mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-32" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </main>
    }>
      <StartContent />
    </Suspense>
  );
}
