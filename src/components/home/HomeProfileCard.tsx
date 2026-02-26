"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  User,
  Star,
  MessageCircle,
  Camera,
  MoreHorizontal,
  AlertTriangle,
} from "lucide-react";
import {
  getStoredProfile,
  clearProfile,
  hasStoredProfile,
  getAvatarUrl,
  setAvatarUrl,
} from "@/lib/profile";

const CATEGORIES = ["운세", "타로", "오하아사"] as const;

/** 중앙 소개 문구 (추후 prop/수정 가능) */
const PROFILE_INTRO = "흔들리지 않게, 오늘의 힌트를 전해요";

/** 해시태그 (추후 prop/수정 가능) */
const PROFILE_HASHTAGS = ["#오늘의힌트", "#감정정리", "#선택의순간"];

const REVIEW_DUMMY = [
  { text: "요약이 깔끔해서 한눈에 보기 좋았어요.", date: "26.02.25" },
  { text: "오늘 운세가 너무 길지 않아서 딱 좋네요.", date: "26.02.24" },
  { text: "타로 연출이 생각보다 진짜 같아서 재밌었어요.", date: "26.02.24" },
  { text: "오하아사 랭킹 보는 맛이 있어요.", date: "26.02.23" },
  { text: "추천 행동이 실용적이라 참고하기 좋았어요.", date: "26.02.23" },
  { text: "카드 뽑는 과정이 몰입감 있어요.", date: "26.02.22" },
  { text: "디자인이 깔끔해서 계속 들어오게 돼요.", date: "26.02.22" },
  { text: "결과 공유 링크가 편해서 친구랑 같이 봤어요.", date: "26.02.21" },
  { text: "분야별 운세가 나뉘어 있어서 보기 편해요.", date: "26.02.21" },
  { text: "불필요한 광고 같은 게 없어서 좋네요.", date: "26.02.21" },
];

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function HomeProfileCard() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<(typeof CATEGORIES)[number]>("운세");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [avatarHover, setAvatarHover] = useState(false);

  const profile = getStoredProfile() as Record<string, unknown> | null;
  const hasProfile = hasStoredProfile();

  useEffect(() => {
    setAvatar(getAvatarUrl());
  }, []);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setAvatarUrl(dataUrl);
      setAvatar(dataUrl);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleReset = () => {
    setConfirmOpen(false);
    clearProfile();
    router.replace("/start?next=/");
  };

  const reviews = useMemo(() => shuffle(REVIEW_DUMMY).slice(0, 3), []);

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

  const name = (profile?.name as string) || (profile?.nickname as string) || "방문자";

  return (
    <>
      <Card className="profile-card-glass rounded-3xl border border-border/60 bg-card/80 backdrop-blur-xl shadow-lg shadow-black/5 dark:shadow-black/20 overflow-hidden pt-0">
        {/* A. 상단 헤더 */}
        <div className="profile-widget-header relative rounded-t-3xl px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <h2 className="text-lg font-bold text-foreground truncate">{name}</h2>
            <div className="flex gap-1 shrink-0">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                    selectedCategory === cat
                      ? "bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-400/30"
                      : "bg-muted/60 text-muted-foreground border border-transparent hover:bg-muted"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div className="shrink-0">
            <Popover open={moreOpen} onOpenChange={setMoreOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-40 p-1" align="end">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    setMoreOpen(false);
                    setConfirmOpen(true);
                  }}
                >
                  <AlertTriangle className="w-4 h-4" />
                  프로필 초기화
                </Button>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <CardContent className="p-4 pt-2">
          {/* B. 중앙 아바타 */}
          <div className="flex flex-col items-center py-4">
            <div
              className="relative group cursor-pointer"
              onMouseEnter={() => setAvatarHover(true)}
              onMouseLeave={() => setAvatarHover(false)}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <div className="w-[140px] h-[140px] rounded-full overflow-hidden border-2 border-indigo-200/60 dark:border-indigo-500/30 bg-gradient-to-br from-indigo-100/50 to-violet-100/50 dark:from-indigo-900/30 dark:to-violet-900/30 flex items-center justify-center ring-2 ring-indigo-200/40 dark:ring-indigo-500/20 ring-offset-2 ring-offset-background">
                {avatar ? (
                  <Image
                    src={avatar}
                    alt="프로필"
                    width={140}
                    height={140}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-muted-foreground">
                    <Camera className="w-8 h-8" />
                    <span className="text-[10px]">사진 추가</span>
                  </div>
                )}
              </div>
              {avatarHover && (
                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                  <span className="text-base text-white font-medium">사진 변경</span>
                </div>
              )}
            </div>

            {/* C. 소개 문구 + 해시태그 */}
            <p className="text-[17px] font-semibold text-foreground mt-3 text-center leading-snug">
              {PROFILE_INTRO}
            </p>
            <div className="flex flex-wrap justify-center gap-1.5 mt-2">
              {PROFILE_HASHTAGS.map((tag) => (
                <span
                  key={tag}
                  className="text-[12px] text-muted-foreground px-2 py-0.5 rounded-md bg-muted/50"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* D. 평점/후기 섹션 */}
          <div className="border-t border-border/50 pt-4 mt-1">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="text-sm font-semibold">4.8</span>
              <span className="text-xs text-muted-foreground">(후기 120+)</span>
            </div>
            <div className="space-y-3">
              {reviews.map((r, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <MessageCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="flex-1 text-muted-foreground line-clamp-2">{r.text}</p>
                  <span className="text-xs text-muted-foreground/80 shrink-0">{r.date}</span>
                </div>
              ))}
            </div>
          </div>

        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md" showCloseButton={true}>
          <DialogHeader>
            <DialogTitle>프로필 초기화</DialogTitle>
            <DialogDescription>
              프로필을 초기화할까요? 저장된 정보와 프로필 사진이 삭제됩니다.
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
