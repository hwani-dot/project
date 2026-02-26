"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { User, Pencil, Copy, CheckCircle2, AlertTriangle } from "lucide-react";
import {
  getStoredProfile,
  getBirthParts,
  clearProfile,
  hasStoredProfile,
} from "@/lib/profile";
import { getZodiacFromBirthday } from "@/lib/zodiac";
import { getZodiacIcon } from "@/lib/zodiac-icons";

const GENDER_LABELS: Record<string, string> = {
  M: "남성",
  F: "여성",
  male: "남성",
  female: "여성",
};

function formatProfileText(profile: Record<string, unknown>): string {
  const lines: string[] = [];
  const { year, month, day } = getBirthParts(profile);
  const name = (profile.name as string) || (profile.nickname as string) || "방문자";
  const gender = profile.gender as string | undefined;
  const interests = (profile.interests as string[] | undefined) ?? [];

  lines.push(`이름: ${name}`);
  lines.push(`생년월일: ${year}. ${month}. ${day}`);
  if (gender) lines.push(`성별: ${GENDER_LABELS[gender] ?? gender}`);
  if (interests.length > 0) lines.push(`관심사: ${interests.join(", ")}`);

  const skip = new Set(["name", "nickname", "birth", "birthYear", "birthMonth", "birthDay", "gender", "interests"]);
  for (const [k, v] of Object.entries(profile)) {
    if (skip.has(k) || v == null || typeof v === "object") continue;
    lines.push(`${k}: ${String(v)}`);
  }
  return lines.join("\n");
}

export type ProfileCardVariant = "full" | "compact";

interface ProfileCardProps {
  variant?: ProfileCardVariant;
  /** 수정 후 이동 경로 (next param) */
  editNext?: string;
  /** 초기화 후 이동 경로 */
  resetNext?: string;
  /** 복사 완료 시 토스트 콜백 (full에서만 사용) */
  onCopyToast?: (msg: string) => void;
}

export function ProfileCard({
  variant = "full",
  editNext = "/me",
  resetNext = "/",
  onCopyToast,
}: ProfileCardProps) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const profile = getStoredProfile() as Record<string, unknown> | null;
  const hasProfile = hasStoredProfile();

  const handleReset = () => {
    setConfirmOpen(false);
    clearProfile();
    router.replace(`/start?next=${encodeURIComponent(resetNext)}`);
  };

  const handleCopy = async () => {
    if (!profile) return;
    const text = formatProfileText(profile);
    await navigator.clipboard.writeText(text);
    onCopyToast?.("복사 완료");
  };

  if (!hasProfile) {
    return (
      <Card className="profile-card-glass rounded-2xl border-border/60 bg-card/80 backdrop-blur-xl shadow-lg shadow-black/5 dark:shadow-black/20">
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center shrink-0">
              <User className="w-7 h-7 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground">정보 입력이 필요해요</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                생년월일을 입력하면 맞춤 운세를 볼 수 있어요
              </p>
            </div>
          </div>
          <Link href="/start?next=/" className="block mt-4">
            <Button className="w-full" size="lg">
              시작하기
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const { year, month, day } = getBirthParts(profile);
  const birthStr = `${year}. ${month}. ${day}`;
  const name = (profile?.name as string) || (profile?.nickname as string) || "방문자";
  const gender = profile?.gender as string | undefined;
  const interests = (profile?.interests as string[] | undefined) ?? [];
  const birthTime = profile?.birthTime as string | undefined;
  const zodiacSign = getZodiacFromBirthday(year, month, day);
  const ZodiacIcon = zodiacSign ? getZodiacIcon(zodiacSign.slug) : User;

  const summaryLine =
    interests.length > 0
      ? `오늘의 운세는 '${interests.join("/")}' 중심으로 보여드려요.`
      : "오늘의 운세를 전반적으로 보여드려요.";

  const isCompact = variant === "compact";

  return (
    <>
      <Card className="profile-card-glass rounded-2xl border-border/60 bg-card/80 backdrop-blur-xl shadow-lg shadow-black/5 dark:shadow-black/20">
        <CardContent className={isCompact ? "p-5" : "p-6"}>
          <div
            className={`flex items-start gap-4 ${isCompact ? "mb-4" : "mb-6"}`}
          >
            <div
              className={`rounded-full bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center shrink-0 border-2 border-indigo-500/20 ${
                isCompact ? "w-16 h-16" : "w-20 h-20"
              }`}
            >
              <ZodiacIcon
                className={`text-indigo-600 dark:text-indigo-400 ${
                  isCompact ? "w-8 h-8" : "w-10 h-10"
                }`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2
                  className={`font-bold text-foreground truncate ${
                    isCompact ? "text-lg" : "text-xl"
                  }`}
                >
                  {name}
                </h2>
                {zodiacSign && (
                  <Badge variant="secondary" className="text-xs">
                    {zodiacSign.krName}자리
                  </Badge>
                )}
                <Badge
                  variant="outline"
                  className="text-xs text-muted-foreground border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                >
                  <CheckCircle2 className="w-3 h-3 mr-0.5" />
                  프로필 저장됨
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{birthStr}</p>
            </div>
          </div>

          <dl
            className={`grid grid-cols-2 gap-x-6 gap-y-4 text-sm ${
              isCompact ? "mb-4" : "mb-4"
            }`}
          >
            <div>
              <dt className="text-muted-foreground text-xs mb-0.5">생년월일</dt>
              <dd className="font-medium">{birthStr}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs mb-0.5">성별</dt>
              <dd className="font-medium">
                {gender ? GENDER_LABELS[gender] ?? gender : "미입력"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs mb-0.5">관심사</dt>
              <dd className="font-medium">
                {interests.length > 0 ? interests.join(", ") : "없음"}
              </dd>
            </div>
            {!isCompact && (
              <div>
                <dt className="text-muted-foreground text-xs mb-0.5">태어난 시간</dt>
                <dd className="font-medium">{birthTime || "미입력"}</dd>
              </div>
            )}
          </dl>

          {!isCompact && (
            <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg px-4 py-3 mb-6">
              {summaryLine}
            </p>
          )}

          <div
            className={`flex flex-wrap items-center gap-2 ${
              isCompact ? "" : "pt-4 border-t border-border/60"
            }`}
          >
            <Link href={`/start?edit=1&next=${encodeURIComponent(editNext)}`}>
              <Button variant="default" size={isCompact ? "sm" : "default"} className="gap-2">
                <Pencil className="w-4 h-4" />
                {isCompact ? "수정" : "수정하기"}
              </Button>
            </Link>
            {!isCompact && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={handleCopy}
              >
                <Copy className="w-4 h-4" />
                프로필 텍스트 복사
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 ml-auto"
              onClick={() => setConfirmOpen(true)}
            >
              <AlertTriangle className="w-4 h-4" />
              {isCompact ? "초기화" : "초기화 (로그아웃)"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md" showCloseButton={true}>
          <DialogHeader>
            <DialogTitle>프로필 초기화</DialogTitle>
            <DialogDescription>
              프로필을 초기화할까요? 저장된 정보가 삭제됩니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleReset}>
              초기화
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
