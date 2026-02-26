"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Star, MessageCircle, Camera } from "lucide-react";
import { getLeaderAvatarUrl, setLeaderAvatarUrl } from "@/lib/profile";

/** 리더 프로필 고정 데이터 (추후 API/환경변수로 교체 가능) */
const LEADER_DATA = {
  name: "이재환",
  expertise: ["운세", "타로", "오하아사"] as const,
  signature: "흔들리지 않게, 오늘의 힌트를 전해요",
  hashtags: ["#오늘의힌트", "#감정정리", "#선택의순간"],
  rating: 4.8,
  reviewCount: "120+",
  avatarPath: "/leader.jpg",
};

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

export function LeaderProfileCard() {
  const reviews = useMemo(() => shuffle(REVIEW_DUMMY).slice(0, 3), []);

  return (
    <Card className="profile-card-glass rounded-3xl border border-border/60 bg-card/80 backdrop-blur-xl shadow-lg shadow-black/5 dark:shadow-black/20 overflow-hidden pt-0">
      <div className="profile-widget-header relative rounded-t-3xl px-4 py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <h2 className="text-lg font-bold text-foreground truncate">{LEADER_DATA.name}</h2>
          <div className="flex gap-1 shrink-0">
            {LEADER_DATA.expertise.map((cat) => (
              <span
                key={cat}
                className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-400/30"
              >
                {cat}
              </span>
            ))}
          </div>
        </div>
      </div>

      <CardContent className="p-4 pt-2">
        <div className="flex flex-col items-center py-4">
          <LeaderAvatar />
          <p className="text-[17px] font-semibold text-foreground mt-3 text-center leading-snug">
            {LEADER_DATA.signature}
          </p>
          <div className="flex flex-wrap justify-center gap-1.5 mt-2">
            {LEADER_DATA.hashtags.map((tag) => (
              <span
                key={tag}
                className="text-[12px] text-muted-foreground px-2 py-0.5 rounded-md bg-muted/50"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="border-t border-border/50 pt-4 mt-1">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span className="text-sm font-semibold">{LEADER_DATA.rating}</span>
            <span className="text-xs text-muted-foreground">(후기 {LEADER_DATA.reviewCount})</span>
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
  );
}

function LeaderAvatar() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imgError, setImgError] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  useEffect(() => {
    setUploadedUrl(getLeaderAvatarUrl());
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setLeaderAvatarUrl(dataUrl);
      setUploadedUrl(dataUrl);
      setImgError(false);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
      className="relative w-[140px] h-[140px] rounded-full overflow-hidden border-2 border-indigo-200/60 dark:border-indigo-500/30 bg-gradient-to-br from-indigo-100/50 to-violet-100/50 dark:from-indigo-900/30 dark:to-violet-900/30 flex items-center justify-center ring-2 ring-indigo-200/40 dark:ring-indigo-500/20 ring-offset-2 ring-offset-background cursor-pointer hover:opacity-90 transition-opacity"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      {uploadedUrl ? (
        <Image
          src={uploadedUrl}
          alt={LEADER_DATA.name}
          width={140}
          height={140}
          className="w-full h-full object-cover"
          unoptimized
        />
      ) : !imgError ? (
        <Image
          src={LEADER_DATA.avatarPath}
          alt={LEADER_DATA.name}
          width={140}
          height={140}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="flex flex-col items-center justify-center gap-1 text-muted-foreground">
          <Camera className="w-8 h-8" />
          <span className="text-sm">사진 추가</span>
        </div>
      )}
    </div>
  );
}
