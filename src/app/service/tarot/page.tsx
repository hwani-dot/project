"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Share2,
  Copy,
  Lightbulb,
  AlertTriangle,
  History,
  Home,
  Moon,
  Star,
  Shuffle,
  ChevronLeft,
  Sparkles,
  Flame,
  Heart,
  Swords,
  CircleDot,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { addToHistory, getHistory } from "@/lib/history";
import { getStoredProfile, getBirthParts } from "@/lib/profile";
import { Disclaimer } from "@/components/fortune/Disclaimer";
import { ProfileGate } from "@/components/fortune/ProfileGate";
import type { TarotResult, TarotCardResult, TarotSpread } from "@/types/fortune";
import tarotData from "@/data/tarot.json";

const TAROT_MAP = Object.fromEntries(
  (tarotData as { id: string; name: string; krName: string; suit?: string }[]).map((c) => [
    String(c.id),
    { name: c.name, krName: c.krName, suit: c.suit ?? "major" },
  ])
) as Record<string, { name: string; krName: string; suit: string }>;

function formatCardName(card: TarotCardResult): string {
  const meta = TAROT_MAP[card.id];
  const kr = card.name;
  const en = meta?.name ?? card.id;
  return `${kr} (${en})`;
}

const DISCLAIMER_PHRASE =
  "카드들이 전하고자 하는 메시지를 마음에 새겨 보세요. 참고용으로 활용하시면 좋겠습니다.";

function cleanSummary(text: string): string {
  return text.split(DISCLAIMER_PHRASE).join("").trim();
}

/** 해석에서 한 줄 요약 추출 (첫 문장 또는 60자) */
function getOneLineSummary(interpretation: string, maxLen = 60): string {
  const cleaned = interpretation.replace(/\s+/g, " ").trim();
  const firstSentence = cleaned.split(/[.!?。]/)[0]?.trim();
  if (firstSentence && firstSentence.length <= maxLen) return firstSentence;
  if (cleaned.length <= maxLen) return cleaned;
  return cleaned.slice(0, maxLen).trim() + "…";
}

const SUIT_ICONS: Record<string, typeof Sparkles> = {
  major: Sparkles,
  wands: Flame,
  cups: Heart,
  swords: Swords,
  pentacles: CircleDot,
};

const POSITION_LABELS: Record<string, string> = {
  past: "과거",
  present: "현재",
  future: "미래",
};

const BACK_COUNT = { single: 3, three_past_present_future: 6 } as const;
const PICK_COUNT = { single: 1, three_past_present_future: 3 } as const;

/* 2.5:4 비율, 타로 덱 주인공급 크기 (20~30% 확대) */
const CARD_RATIO = { w: 175, h: 280 };
const CARD_RATIO_MD = { w: 195, h: 312 };

const QUESTION_CHIPS = [
  "오늘 연애운은?",
  "돈 관리 어떻게?",
  "학업/시험 잘 될까?",
  "취업/직장 흐름?",
  "친구/인간관계?",
  "내가 조심할 점은?",
  "지금 선택이 맞을까?",
];

function CardBack({
  isSelected,
  isShuffling,
  onClick,
  shuffleIndex,
  className,
}: {
  isSelected: boolean;
  isShuffling?: boolean;
  onClick: () => void;
  shuffleIndex?: number;
  className?: string;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick()}
      className={cn(
        "relative rounded-xl flex flex-col items-center justify-center overflow-hidden tarot-card-back tarot-card-deck",
        "w-[175px] h-[280px] md:w-[195px] md:h-[312px]",
        "border border-amber-900/30",
        isShuffling ? "tarot-card-shuffle cursor-default pointer-events-none" : "cursor-pointer",
        isShuffling && shuffleIndex !== undefined && "tarot-shuffle-swap",
        isSelected
          ? "tarot-card-selected ring-2 ring-violet-400/55 ring-offset-2 ring-offset-transparent"
          : "hover:border-violet-500/40",
        className
      )}
      data-shuffle-index={isShuffling && shuffleIndex !== undefined ? shuffleIndex : undefined}
    >
      <div
        className="absolute inset-0 rounded-xl tarot-card-back-inner"
        style={{
          background: `
            radial-gradient(ellipse 80% 120% at 50% 50%, rgba(30,25,50,0.4) 0%, transparent 60%),
            linear-gradient(168deg, rgba(10,8,20,0.98) 0%, rgba(4,3,12,0.99) 50%, rgba(8,6,18,0.98) 100%),
            repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(139,92,246,0.03) 2px, rgba(139,92,246,0.03) 4px),
            repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(99,102,241,0.02) 2px, rgba(99,102,241,0.02) 4px)
          `,
        }}
      />
      <div className="absolute inset-2 rounded-lg border border-amber-800/25 border-double border-[3px]" />
      <div className="absolute inset-4 rounded-md border border-violet-500/15" />
      <div className="absolute top-2 left-2 w-4 h-4 rounded-sm border border-amber-600/30" />
      <div className="absolute top-2 right-2 w-4 h-4 rounded-sm border border-amber-600/30" />
      <div className="absolute bottom-2 left-2 w-4 h-4 rounded-sm border border-amber-600/30" />
      <div className="absolute bottom-2 right-2 w-4 h-4 rounded-sm border border-amber-600/30" />
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <Moon className="h-12 w-12 text-amber-500/40 mb-1 drop-shadow-[0_0_20px_rgba(139,92,246,0.2)] opacity-90" />
        <Star className="h-5 w-5 text-violet-400/35 drop-shadow-[0_0_8px_rgba(139,92,246,0.15)]" />
      </div>
    </div>
  );
}

type RevealPhase = "idle" | "spotlight" | "flipping" | "revealed";

function TarotCardFlip({
  card,
  isFlipped,
  positionLabel,
  oneLineSummary,
  cardRef,
}: {
  card: TarotCardResult;
  isFlipped: boolean;
  positionLabel?: string;
  oneLineSummary?: string;
  cardRef?: (el: HTMLDivElement | null) => void;
}) {
  const [revealPhase, setRevealPhase] = useState<RevealPhase>("idle");
  const hasTriggeredRef = useRef(false);
  const frozenCard = useRef(card).current;
  const displayCard = revealPhase === "revealed" ? card : frozenCard;
  const suit = TAROT_MAP[String(displayCard.id)]?.suit ?? "major";
  const SuitIcon = SUIT_ICONS[suit] ?? Sparkles;
  const isPlaceholder = displayCard.id === "loading";

  useEffect(() => {
    if (!isFlipped || hasTriggeredRef.current) return;
    hasTriggeredRef.current = true;
    const t1 = setTimeout(() => setRevealPhase("spotlight"), 0);
    const t2 = setTimeout(() => setRevealPhase("flipping"), 450);
    const t3 = setTimeout(() => setRevealPhase("revealed"), 450 + 850);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      hasTriggeredRef.current = false;
    };
  }, [isFlipped]);

  const showFront = revealPhase === "flipping" || revealPhase === "revealed";
  const isFlipping = revealPhase === "flipping";
  const isRevealed = revealPhase === "revealed";

  return (
    <div className="relative flex flex-col items-center tarot-card-wrapper overflow-visible">
      <div className="relative w-[175px] h-[280px] md:w-[195px] md:h-[312px]">
        <div
          ref={cardRef}
          className={cn(
            "relative z-10 w-full h-full transition-all duration-300",
            (isFlipping || isRevealed) && "tarot-reveal-pop"
          )}
          style={{ perspective: "1200px" }}
        >
        <div
          className={cn(
            "absolute inset-0 tarot-flip-inner",
            showFront && "is-flipped",
            isFlipping && "tarot-flip-glare"
          )}
        >
          <div
            className="tarot-flip-back absolute inset-0 rounded-xl overflow-hidden"
            style={{
              background: `
                radial-gradient(ellipse 80% 120% at 50% 50%, rgba(30,25,50,0.4) 0%, transparent 60%),
                linear-gradient(168deg, rgba(10,8,20,0.98) 0%, rgba(4,3,12,0.99) 50%, rgba(8,6,18,0.98) 100%),
                repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(139,92,246,0.02) 2px, rgba(139,92,246,0.02) 4px)
              `,
              border: "1px solid rgba(139,92,246,0.12)",
              boxShadow: "inset 0 0 40px rgba(0,0,0,0.3), 0 6px 24px rgba(0,0,0,0.6), 0 0 0 1px rgba(139,92,246,0.08)",
            }}
          >
            <div className="absolute inset-2 rounded-lg border border-amber-800/20" />
            <div className="absolute inset-4 rounded-md border border-violet-500/10" />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Moon className="h-12 w-12 text-amber-500/40 mb-1 drop-shadow-[0_0_16px_rgba(139,92,246,0.2)]" />
              <Star className="h-5 w-5 text-violet-400/35 drop-shadow-[0_0_8px_rgba(139,92,246,0.15)]" />
            </div>
          </div>
          <div
            className="tarot-flip-front absolute inset-0 rounded-xl overflow-hidden flex flex-col"
            style={{
              background: `
                radial-gradient(ellipse 80% 100% at 50% 30%, rgba(60,50,90,0.3) 0%, transparent 50%),
                linear-gradient(172deg, rgba(35,30,55,0.98) 0%, rgba(18,15,32,0.99) 50%, rgba(25,20,45,0.98) 100%)
              `,
              border: "1px solid rgba(180,160,220,0.15)",
              boxShadow: "inset 0 0 48px rgba(139,92,246,0.05), inset 0 2px 0 rgba(255,255,255,0.03), 0 6px 28px rgba(0,0,0,0.5)",
            }}
          >
            <div className="absolute inset-2 rounded-lg border border-amber-800/20" />
            <div className="absolute inset-3 rounded-md border border-violet-500/12" />
            <div className="flex-1 flex flex-col items-center justify-center p-4 relative z-10">
              {isPlaceholder ? (
                <>
                  <Loader2 className="h-10 w-10 text-violet-400/60 animate-spin mb-3" />
                  <span className="text-[14px] font-medium text-violet-200/80">{displayCard.name}</span>
                </>
              ) : (
                <>
                  <span className="text-[14px] sm:text-[16px] font-bold text-center leading-tight text-violet-100/95 drop-shadow-[0_0_12px_rgba(139,92,246,0.15)]">
                    {formatCardName(displayCard)}
                  </span>
                  <div className="mt-3 flex justify-center">
                    <SuitIcon className="h-10 w-10 text-violet-400/60 drop-shadow-[0_0_12px_rgba(139,92,246,0.2)]" />
                  </div>
                  <div className="flex flex-wrap justify-center gap-1.5 mt-3">
                    {displayCard.keywords.slice(0, 3).map((kw, j) => (
                      <span
                        key={j}
                        className="text-[12px] px-2.5 py-1 rounded-full bg-violet-950/50 text-violet-200/90 border border-violet-500/15"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        </div>
      </div>
      {positionLabel && (
        <span className="text-[14px] text-amber-200/70 mt-2 font-medium">{positionLabel}</span>
      )}
      {oneLineSummary && (
        <p className="text-xs text-violet-300/80 mt-1.5 max-w-[175px] md:max-w-[195px] text-center line-clamp-2 leading-snug">
          {oneLineSummary}
        </p>
      )}
    </div>
  );
}

function PositionBadge({ position }: { position?: string }) {
  if (!position) return null;
  return (
    <Badge variant="outline" className="border-violet-500/30 text-violet-300">
      {POSITION_LABELS[position]}
    </Badge>
  );
}

function TarotPageContent() {
  const searchParams = useSearchParams();
  const fromHistoryId = searchParams.get("from") === "history" ? searchParams.get("id") : null;

  const [spread, setSpread] = useState<TarotSpread>("single");
  const [question, setQuestion] = useState("");
  const [phase, setPhase] = useState<"idle" | "shuffling" | "selecting" | "revealing" | "loading" | "result">("idle");
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [data, setData] = useState<TarotResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rerollCount, setRerollCount] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [spotlightPositions, setSpotlightPositions] = useState<{ x: number; y: number }[]>([]);
  const [showSpotlight, setShowSpotlight] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const profile = getStoredProfile() as Record<string, unknown> | null;
  const backCount = BACK_COUNT[spread];
  const pickCount = PICK_COUNT[spread];

  useEffect(() => {
    if (phase !== "revealing") return;
    const calcPositions = () => {
      const table = tableRef.current;
      if (!table) return;
      const tableRect = table.getBoundingClientRect();
      const positions: { x: number; y: number }[] = [];
      for (let i = 0; i < pickCount; i++) {
        const card = cardRefs.current[i];
        if (!card) continue;
        const cardRect = card.getBoundingClientRect();
        const cx = cardRect.left + cardRect.width / 2;
        const cy = cardRect.top + cardRect.height / 2;
        positions.push({
          x: cx - tableRect.left,
          y: cy - tableRect.top,
        });
      }
      if (positions.length > 0) {
        setSpotlightPositions(positions);
        setShowSpotlight(true);
      }
    };
    const t1 = setTimeout(calcPositions, 0);
    const t2 = setTimeout(calcPositions, 50);
    const t3 = setTimeout(calcPositions, 120);
    const hideTimer = setTimeout(() => setShowSpotlight(false), 300);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(hideTimer);
    };
  }, [phase, pickCount]);

  useEffect(() => {
    if (fromHistoryId) {
      const items = getHistory();
      const item = items.find((h: { id: string }) => h.id === fromHistoryId);
      if (item && item.type === "tarot" && item.payload) {
        const p = item.payload as TarotResult;
        setData(p);
        setPhase("result");
        if (p.spread) setSpread(p.spread);
        if (p.question) setQuestion(p.question);
      }
    }
  }, [fromHistoryId]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleDraw = async (overrideReroll?: number) => {
    if (phase === "selecting" && selectedIndices.length < pickCount) return;

    setError(null);
    setPhase("revealing");

    const count = overrideReroll ?? rerollCount;

    try {
      const { year, month, day } = getBirthParts(profile);
      const birth =
        (profile?.birth as string) ??
        `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const profileSnapshot = {
        birth,
        name: (profile?.name as string) ?? (profile?.nickname as string) ?? "방문자",
        interests: profile?.interests as string[] | undefined,
      };

      const res = await fetch("/api/fortune/tarot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spread,
          question: question.trim() || undefined,
          profileSnapshot,
          rerollCount: count,
          selectedIndices: selectedIndices.length === pickCount ? selectedIndices : undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error ?? "타로 해석에 실패했습니다.");
        setPhase("selecting");
        return;
      }

      const json = (await res.json()) as TarotResult;
      setData(json);

      addToHistory({
        type: "tarot",
        title: json.headline,
        summary: json.summary.slice(0, 80) + (json.summary.length > 80 ? "…" : ""),
        payload: { ...json, question: json.question, spread: json.spread },
      });
      setPhase("result");
    } catch {
      setError("타로 해석에 실패했습니다. 잠시 후 다시 시도해 주세요.");
      setPhase("selecting");
    }
  };

  const handleShuffle = () => {
    setData(null);
    setError(null);
    setSelectedIndices([]);
    setSpotlightPositions([]);
    setShowSpotlight(false);
    setPhase("shuffling");
    const duration = 900 + Math.floor(Math.random() * 400); // 0.9~1.3초
    setTimeout(() => setPhase("selecting"), duration);
  };

  const handleSelectBack = (idx: number) => {
    setSelectedIndices((prev) => {
      if (prev.includes(idx)) {
        return prev.filter((i) => i !== idx);
      }
      if (prev.length >= pickCount) {
        return [...prev.slice(1), idx].sort((a, b) => a - b);
      }
      return [...prev, idx].sort((a, b) => a - b);
    });
  };

  const handleRandomPick = () => {
    const indices: number[] = [];
    const pool = Array.from({ length: backCount }, (_, i) => i);
    for (let i = 0; i < pickCount; i++) {
      const j = Math.floor(Math.random() * pool.length);
      indices.push(pool.splice(j, 1)[0]!);
    }
    indices.sort((a, b) => a - b);
    setSelectedIndices(indices);
    setTimeout(() => handleDraw(), 100);
  };

  const handleReroll = () => {
    setRerollCount((c) => c + 1);
    setData(null);
    setSelectedIndices([]);
    setSpotlightPositions([]);
    setShowSpotlight(false);
    setPhase("shuffling");
    const duration = 900 + Math.floor(Math.random() * 400);
    setTimeout(() => setPhase("selecting"), duration);
  };

  const handleCopySummary = async () => {
    if (!data) return;
    const q = data.question || question;
    const lines: string[] = [];
    if (q) lines.push(`질문: ${q}`);
    lines.push(`[${data.date}] ${data.spread === "single" ? "1장" : "3장"} 스프레드`);
    data.cards.forEach((card, i) => {
      const pos = card.position ? POSITION_LABELS[card.position] : (data!.cards.length > 1 ? ["과거", "현재", "미래"][i] : "");
      const oneLine = getOneLineSummary(card.interpretation);
      lines.push(`${pos ? pos + " " : ""}${formatCardName(card)}: ${oneLine}`);
    });
    lines.push(`\n${data.headline}`);
    lines.push(cleanSummary(data.summary));
    await navigator.clipboard.writeText(lines.join("\n"));
    showToast("요약이 복사되었습니다!");
  };

  const handleShare = async () => {
    if (!data || !profile) return;
    const { year, month, day } = getBirthParts(profile);
    const birth =
      (profile.birth as string) ??
      `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const sharePayload = {
      kind: "tarot" as const,
      date: data.date,
      profileSnapshot: {
        name: (profile.name as string) ?? (profile.nickname as string) ?? "방문자",
        birth,
        interests: profile.interests as string[] | undefined,
      },
      result: data,
    };
    const res = await fetch("/api/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "tarot", payload: sharePayload }),
    });
    if (res.ok) {
      const { url } = await res.json();
      await navigator.clipboard.writeText(`${window.location.origin}${url}`);
      showToast("링크가 복사되었습니다!");
    } else {
      showToast("공유에 실패했습니다.");
    }
  };

  if (error) {
    return (
      <main className="tarot-page min-h-screen">
        <div className="relative z-10 container max-w-6xl mx-auto px-4 py-10">
          <div className="tarot-glass rounded-2xl p-8">
            <p className="text-red-300/90">{error}</p>
            <Button
              size="sm"
              className="mt-4 bg-violet-600 hover:bg-violet-500"
              onClick={() => setError(null)}
            >
              다시 시도
            </Button>
          </div>
          <Disclaimer />
        </div>
      </main>
    );
  }

  return (
    <main className="tarot-page min-h-screen">
      <div className="relative z-10 container max-w-6xl mx-auto px-4 py-10 sm:py-14">
        {/* (A) 상단 헤더 - 타이틀, 설명, 버튼 2개만 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10 sm:mb-12">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-violet-50/98 tracking-tight">
              타로 뽑기
            </h1>
            <p className="mt-2 text-sm text-violet-300/80">
              질문을 선택하거나 입력해 카드를 뽑아보세요
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            {fromHistoryId && (
              <Link href="/history">
                <Button
                  variant="outline"
                  size="icon"
                  className="border-white/15 bg-white/5 text-violet-200 hover:bg-white/10 hover:border-violet-500/30 focus-visible:ring-violet-500/50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </Link>
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={handleShare}
              disabled={!data}
              className="border-white/15 bg-white/5 text-violet-200 hover:bg-white/10 hover:border-violet-500/30 focus-visible:ring-violet-500/50 disabled:opacity-50"
            >
              <Share2 className="h-4 w-4" />
            </Button>
            <Link href="/history">
              <Button
                variant="outline"
                size="icon"
                className="border-white/15 bg-white/5 text-violet-200 hover:bg-white/10 hover:border-violet-500/30 focus-visible:ring-violet-500/50"
              >
                <History className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/">
              <Button
                variant="outline"
                size="icon"
                className="border-white/15 bg-white/5 text-violet-200 hover:bg-white/10 hover:border-violet-500/30 focus-visible:ring-violet-500/50"
              >
                <Home className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* (B) 큰 glass 패널 1개 - 스프레드/추천질문/입력/CTA */}
        <div className="tarot-glass rounded-2xl p-8 sm:p-10 mb-10">
          <div className="space-y-8">
            <div>
              <p className="text-sm font-medium text-violet-300/90 mb-3">스프레드</p>
              <div className="inline-flex rounded-xl bg-black/40 p-1.5 border border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setSpread("single");
                    if (phase === "selecting" || phase === "shuffling") setPhase("idle");
                    setSelectedIndices([]);
                  }}
                  className={cn(
                    "px-6 py-3 rounded-lg text-sm font-semibold transition-all",
                    spread === "single"
                      ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25"
                      : "text-violet-300/90 hover:text-violet-100 hover:bg-white/5"
                  )}
                >
                  1장 (한 줄 조언)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSpread("three_past_present_future");
                    if (phase === "selecting" || phase === "shuffling") setPhase("idle");
                    setSelectedIndices([]);
                  }}
                  className={cn(
                    "px-6 py-3 rounded-lg text-sm font-semibold transition-all",
                    spread === "three_past_present_future"
                      ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25"
                      : "text-violet-300/90 hover:text-violet-100 hover:bg-white/5"
                  )}
                >
                  3장 (과거 · 현재 · 미래)
                </button>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-violet-300/90 mb-3">추천 질문</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {QUESTION_CHIPS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setQuestion(question === q ? "" : q)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-all border",
                      question === q
                        ? "bg-violet-600/70 text-white border-violet-400/50 shadow-lg shadow-violet-500/20"
                        : "bg-black/25 text-violet-200/95 border-white/10 hover:border-violet-500/40 hover:bg-violet-500/15"
                    )}
                  >
                    {q}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="직접 입력하거나 위에서 선택"
                className="w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3.5 text-sm text-violet-100 placeholder:text-violet-400/50 focus:border-violet-500/50 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
              />
            </div>

            <div className="flex flex-wrap gap-3 items-center pt-2">
              <Button
                onClick={
                  phase === "idle" || phase === "result"
                    ? handleShuffle
                    : undefined
                }
                disabled={phase === "selecting" || phase === "shuffling" || phase === "revealing"}
                className="tarot-cta min-w-[200px] px-8 py-6 text-lg font-semibold rounded-xl bg-gradient-to-r from-violet-600 via-violet-500 to-indigo-600 hover:from-violet-500 hover:via-violet-400 hover:to-indigo-500 text-white shadow-xl shadow-violet-500/30 hover:shadow-violet-500/40 transition-all focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a12]"
              >
                {phase === "result" ? "다시 셔플" : "셔플하기"}
              </Button>
              {phase === "result" && (
                <Button
                  onClick={handleReroll}
                  variant="outline"
                  className="border-violet-500/50 bg-transparent text-violet-200 hover:bg-violet-500/20 hover:border-violet-400/60 px-6 py-6 text-base font-medium"
                >
                  다시 뽑기
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* (C) 카드 테이블 영역 */}
        {(phase === "shuffling" || phase === "selecting" || phase === "revealing" || phase === "result") && (
          <div className="mb-10">
            <p className="text-sm text-violet-300/70 mb-6 text-center">
              카드를 뽑아 펼쳐보세요
            </p>
            <div
              ref={tableRef}
              className={cn(
                "tarot-table tarot-card-floor rounded-2xl relative transition-all duration-300 overflow-hidden",
                phase === "shuffling" && "tarot-shuffling-area"
              )}
            >
              {showSpotlight &&
                spotlightPositions.map((pos, i) => (
                  <div
                    key={i}
                    className="absolute pointer-events-none z-[6] tarot-reveal-spotlight tarot-spotlight-phase-spread rounded-[2rem] w-[335px] h-[440px] md:w-[355px] md:h-[472px]"
                    style={{
                      left: pos.x,
                      top: pos.y,
                      transform: "translate(-50%, -50%)",
                    }}
                    aria-hidden
                  />
                ))}
              {phase === "shuffling" && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5 text-sm font-medium text-amber-200/95 drop-shadow-[0_0_12px_rgba(139,92,246,0.4)] tarot-shuffle-label">
                  <Loader2 className="h-5 w-5 animate-spin text-violet-400" />
                  <span>카드를 섞는 중…</span>
                </div>
              )}
              <div className="flex justify-center gap-6 sm:gap-10 flex-wrap py-6 sm:py-10 relative z-10 overflow-visible">
              {(phase === "shuffling" || phase === "selecting") && (
                <>
                  {phase === "shuffling" && (
                    <div className="absolute inset-0 flex justify-center items-center gap-3 pointer-events-none" aria-hidden>
                      {[0, 1, 2, 3].map((g) => (
                        <div
                          key={`ghost-${g}`}
                          className="tarot-ghost-card w-[155px] h-[248px] md:w-[175px] md:h-[280px] rounded-xl shrink-0"
                          style={{ animationDelay: `${350 + g * 60}ms` }}
                        >
                          <div
                            className="absolute inset-0 rounded-xl flex items-center justify-center"
                            style={{
                              background: `
                                radial-gradient(ellipse 80% 120% at 50% 50%, rgba(30,25,50,0.5) 0%, transparent 60%),
                                linear-gradient(168deg, rgba(10,8,20,0.98) 0%, rgba(4,3,12,0.99) 50%, rgba(8,6,18,0.98) 100%)
                              `,
                              border: "1px solid rgba(139,92,246,0.12)",
                              boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
                            }}
                          >
                            <div className="absolute inset-2 rounded-lg border border-amber-800/20" />
                            <Moon className="h-10 w-10 text-amber-500/25" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {Array.from({ length: backCount }).map((_, i) => (
                    <CardBack
                      key={i}
                      isSelected={selectedIndices.includes(i)}
                      isShuffling={phase === "shuffling"}
                      shuffleIndex={i}
                      onClick={() => phase === "selecting" && handleSelectBack(i)}
                    />
                  ))}
                  {phase === "selecting" && (
                    <div className="w-full flex flex-col items-center gap-3 mt-6">
                      <div className="flex flex-wrap justify-center gap-3">
                        {selectedIndices.length === pickCount && (
                          <Button
                            onClick={() => handleDraw()}
                            className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25 hover:from-violet-500 hover:to-indigo-500"
                          >
                            {spread === "single" ? "이 카드로 뽑기" : "이 카드들로 뽑기"}
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          onClick={handleRandomPick}
                          className="border-white/15 bg-white/5 text-violet-200 hover:bg-white/10 hover:border-violet-500/30 focus-visible:ring-violet-500/50"
                        >
                          <Shuffle className="h-4 w-4 mr-2" />
                          {spread === "single" ? "랜덤 선택" : "자동 3장 뽑기"}
                        </Button>
                      </div>
                      <p className="text-sm text-amber-200/70">
                        {spread === "single"
                          ? "원하는 카드를 골라주세요"
                          : "3장의 카드를 선택해 펼쳐보세요"}
                      </p>
                    </div>
                  )}
                </>
              )}
              {(phase === "revealing" || phase === "result") && (
                <>
                  {Array.from({ length: pickCount }).map((_, i) => {
                    const placeholderCard: TarotCardResult = {
                      id: "loading",
                      name: "해석 중…",
                      isReversed: false,
                      position: spread === "three_past_present_future" ? (["past", "present", "future"] as const)[i] : undefined,
                      keywords: [],
                      interpretation: "",
                    };
                    const card = data?.cards[i] ?? placeholderCard;
                    return (
                      <TarotCardFlip
                        key={i}
                        card={card}
                        isFlipped={true}
                        cardRef={(el) => {
                          cardRefs.current[i] = el;
                        }}
                        positionLabel={
                          spread === "three_past_present_future"
                            ? (card.position ? POSITION_LABELS[card.position] : ["과거", "현재", "미래"][i])
                            : undefined
                        }
                        oneLineSummary={card.interpretation ? getOneLineSummary(card.interpretation) : undefined}
                      />
                    );
                  })}
                </>
              )}
              </div>
            </div>
          </div>
        )}

        {/* (D) 해석/결과 영역 */}
        {phase === "result" && data && (
          <div className="tarot-glass rounded-2xl p-6 sm:p-8 space-y-8">
            {/* 시그니처 헤드라인 + 공유 버튼 (결과 섹션에서만) */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="space-y-3">
                  {(data.question || question) && (
                    <p className="text-sm text-violet-400/90">
                      <span className="font-medium text-violet-300">질문</span> {(data.question || question)}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-sm text-violet-400/70">
                    <span>
                      {spread === "single" ? "1장 스프레드" : "3장 스프레드 (과거 · 현재 · 미래)"}
                    </span>
                    <span>·</span>
                    <span>{data.date}</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-[2.5rem] font-bold text-violet-50/98 leading-tight tracking-tight">
                    {data.headline}
                  </h2>
                  {spread === "three_past_present_future" && data.cards.length >= 3 && (
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 pt-2">
                      {data.cards.map((card, i) => (
                        <div
                          key={i}
                          className="rounded-lg border border-violet-500/20 bg-violet-950/20 px-3 py-2"
                        >
                          <span className="text-[10px] uppercase tracking-wider text-violet-400/80 font-medium">
                            {card.position ? POSITION_LABELS[card.position] : ["과거", "현재", "미래"][i]}
                          </span>
                          <p className="text-sm text-violet-100/90 mt-0.5 leading-snug">
                            {getOneLineSummary(card.interpretation)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="icon"
                    className="border-white/15 bg-white/5 text-violet-200 hover:bg-white/10"
                    onClick={handleShare}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="border-white/15 bg-white/5 text-violet-200 hover:bg-white/10"
                    onClick={handleCopySummary}
                    title="요약 텍스트 복사"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* 리딩 노트 (요약) */}
            <div className="rounded-xl border border-violet-500/25 bg-gradient-to-b from-violet-950/30 to-black/30 p-6 shadow-inner">
              <p className="text-[15px] sm:text-base leading-[1.9] text-violet-100/90 whitespace-pre-wrap">
                {cleanSummary(data.summary)}
              </p>
            </div>

            {/* 카드별 해석 (아코디언) */}
            <section>
              <p className="text-sm font-semibold text-violet-300/95 mb-4 uppercase tracking-wider">카드별 해석</p>
              <div className="space-y-3">
                {data.cards.map((card, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-violet-500/20 bg-black/20 overflow-hidden hover:border-violet-500/30 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-4 p-4">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-semibold text-violet-50/98">
                          {formatCardName(card)}
                        </span>
                        <PositionBadge position={card.position} />
                      </div>
                    </div>
                    <div className="px-4 pb-4 pt-0 border-t border-violet-500/15">
                      <div className="flex flex-wrap gap-2.5 mb-3 mt-3">
                        {card.keywords.map((kw, j) => (
                          <span
                            key={j}
                            className="inline-flex rounded-full bg-violet-500/30 px-4 py-1.5 text-sm text-violet-200/95 font-medium border border-violet-500/20"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                      <p className="text-sm text-violet-100/90 leading-relaxed">
                        {card.interpretation}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 오늘의 조언 / 주의 콜아웃 */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-950/40 to-indigo-950/30 p-5 shadow-inner">
                <div className="flex gap-3">
                  <Lightbulb className="h-5 w-5 text-violet-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-violet-300/95 mb-1.5 uppercase tracking-wider">오늘의 조언</p>
                    <p className="text-sm text-violet-100/90 leading-relaxed">{data.advice}</p>
                  </div>
                </div>
              </div>
              {data.caution && (
                <div className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-950/25 to-amber-950/10 p-5 shadow-inner">
                  <div className="flex gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-amber-300/95 mb-1.5 uppercase tracking-wider">주의</p>
                      <p className="text-sm text-amber-100/90 leading-relaxed">{data.caution}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {toast && (
          <div
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl bg-violet-900/95 backdrop-blur-md border border-violet-500/30 text-violet-100 text-sm font-medium shadow-xl"
            role="status"
          >
            {toast}
          </div>
        )}

        <Disclaimer />
      </div>
    </main>
  );
}

export default function TarotPage() {
  return (
    <ProfileGate>
      <Suspense
        fallback={
          <main className="tarot-page min-h-screen">
            <div className="container max-w-6xl mx-auto px-4 py-10">
              <div className="tarot-glass rounded-2xl p-8">
                <Skeleton className="h-8 w-48 mb-4 bg-white/10" />
                <Skeleton className="h-64 w-full bg-white/10 rounded-xl" />
              </div>
              <Disclaimer />
            </div>
          </main>
        }
      >
        <TarotPageContent />
      </Suspense>
    </ProfileGate>
  );
}
