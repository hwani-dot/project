import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import { ZODIAC_SIGNS } from "@/data/zodiac";
import { seededShuffle, hashString } from "@/lib/seed";
import { isDemoMode, logDemoModeOnce } from "@/lib/demo";
import { format, sub } from "date-fns";
import { ko } from "date-fns/locale";
import type { OhahasaResult, OhahasaItem, OhahasaRankItem } from "@/types/fortune";

const SECRET_SALT = process.env.OHAHASA_SALT ?? "fortune-ohahasa-default";

const RATE_LIMIT = 20;
const rateMap = new Map<string, { count: number; resetAt: number }>();

function hasOpenAIKey() {
  const k = process.env.OPENAI_API_KEY;
  return !!k && k.trim().length > 0;
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);
}

function getClientId(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(clientId);
  if (!entry) return true;
  if (now > entry.resetAt) {
    rateMap.delete(clientId);
    return true;
  }
  return entry.count < RATE_LIMIT;
}

function incrementRate(clientId: string): void {
  const now = Date.now();
  const entry = rateMap.get(clientId);
  if (!entry) {
    rateMap.set(clientId, { count: 1, resetAt: now + 60_000 });
  } else {
    entry.count++;
  }
}

/** 총운 첫 문장에서 시그니처 추출 */
function extractHeadline(overview: string | undefined): string {
  if (!overview?.trim()) return "오늘은 균형만 지키면 무난하게 풀립니다.";
  const first = overview.split(/[.\n]/)[0]?.trim();
  return first && first.length > 5
    ? first + (first.endsWith("요") || first.endsWith("다") ? "" : ".")
    : "오늘은 균형만 지키면 무난하게 풀립니다.";
}

/** 아이템에 luckyTime/cautionTime/headline 보강 */
function enrichItem(it: OhahasaItem): OhahasaItem {
  const luckyTime = it.lucky?.luckyTime ?? it.lucky?.time ?? "오전";
  const cautionTime = it.lucky?.cautionTime ?? null;
  const headline = it.headline ?? extractHeadline(it.overview);
  return {
    ...it,
    headline,
    lucky: {
      ...it.lucky,
      time: it.lucky?.time ?? luckyTime,
      luckyTime,
      cautionTime,
    },
  };
}

/** 캐시 payload를 OhahasaResult로 정규화 */
function normalizeCachedPayload(payload: unknown): OhahasaResult {
  const p = (payload ?? {}) as Record<string, unknown>;
  if (p.items && Array.isArray(p.items) && (p.items as OhahasaItem[])[0]?.breakdown) {
    const result = p as unknown as OhahasaResult;
    result.items = result.items.map(enrichItem);
    return result;
  }
  const ranking = (p.ranking ?? []) as OhahasaRankItem[];
  const dateStr = String(p.date ?? "");
  const items: OhahasaItem[] = ranking.map((r, i) => {
    const sign =
      r.sign ?? { slug: ZODIAC_SIGNS[i]?.slug ?? "aquarius", krName: ZODIAC_SIGNS[i]?.krName ?? "물병" };
    const baseSeed = `${dateStr}-${sign.slug}`;
    const score = r.score ?? Math.max(0, 100 - i * 8);
    const luckyTimeVal =
      (r.lucky as { luckyTime?: string })?.luckyTime ??
      (r.lucky as { time?: string })?.time ??
      r.lucky?.place ??
      "오전";
    const cautionTimeVal = (r.lucky as { cautionTime?: string | null })?.cautionTime ?? null;
    return {
      sign,
      rank: r.rank ?? i + 1,
      score,
      oneLine: r.oneLiner ?? (r as { oneLine?: string }).oneLine ?? "",
      keywords: r.keywords ?? ["에너지", "성장", "균형"],
      lucky: {
        color: r.lucky?.color ?? "골드",
        number: String(r.lucky?.number ?? i + 1),
        item: r.lucky?.item ?? "미정",
        time: luckyTimeVal,
        luckyTime: luckyTimeVal,
        cautionTime: cautionTimeVal,
      },
      breakdown: buildSeedBreakdown(baseSeed),
      deltaRank: null,
      deltaScore: null,
      headline: (r as { headline?: string }).headline ?? undefined,
      overview: (r as { overview?: string }).overview,
      oneLiner: r.oneLiner,
      do: r.do,
      dont: r.dont,
    };
  });
  return {
    date: String(p.date),
    title: String(p.title ?? ""),
    items,
    notes: String(p.notes ?? ""),
    ranking,
  };
}

/** 분야별 행동 팁 */
const ACTION_TIPS: Record<keyof OhahasaItem["breakdown"], string[]> = {
  love: [
    "먼저 가벼운 안부 톡이 유리해요.",
    "오늘은 고백보다는 대화가 좋아요.",
    "연인과의 짧은 식사 시간을 가져보세요.",
    "데이트 계획은 미리 정해두면 좋아요.",
  ],
  money: [
    "충동구매는 오후에 특히 주의하세요.",
    "오늘은 큰 지출 결정을 미루세요.",
    "저축 계좌에 소액이라도 넣어보세요.",
    "예산을 한 번 점검해 보세요.",
  ],
  studyOrCareer: [
    "중요한 작업은 오전 10시 전에 시작하세요.",
    "할 일 목록을 3개만 정해 보세요.",
    "점심 후 10분 산책이 집중력을 높여요.",
    "이메일/메시지는 2회 이내로 답하세요.",
  ],
  health: [
    "10분 스트레칭이 컨디션을 끌어올려요.",
    "물을 하루 8잔 이상 마시세요.",
    "커피는 오후 2시 이후 피하세요.",
    "취침 시간을 30분 앞당겨 보세요.",
  ],
  relations: [
    "오해가 생기면 바로 확인하는 게 좋아요.",
    "동료에게 한 가지 칭찬을 건네보세요.",
    "부탁은 짧고 명확하게 말하면 오해가 줄어요.",
    "가족과의 대화 시간 10분을 확보하세요.",
  ],
};

function buildSeedBreakdown(seed: string): OhahasaItem["breakdown"] {
  const keys: (keyof OhahasaItem["breakdown"])[] = ["love", "money", "studyOrCareer", "health", "relations"];
  const entries = keys.map((key) => {
    const h = hashString(seed + key);
    const score = Math.min(100, Math.max(0, (h % 30) + 60));
    const tips = ACTION_TIPS[key];
    const comment = tips[h % tips.length] ?? tips[0];
    return [key, { score, comment }] as const;
  });
  return Object.fromEntries(entries) as unknown as OhahasaItem["breakdown"];
}

/** 어제 순위/점수 맵 */
function getYesterdayRankMap(yesterdayItems: OhahasaItem[]): Map<string, number> {
  const m = new Map<string, number>();
  yesterdayItems.forEach((it) => m.set(it.sign.slug, it.rank));
  return m;
}
function getYesterdayScoreMap(yesterdayItems: OhahasaItem[]): Map<string, number> {
  const m = new Map<string, number>();
  yesterdayItems.forEach((it) => m.set(it.sign.slug, it.score));
  return m;
}

const KEYWORD_POOLS = [
  ["에너지", "성장", "균형"],
  ["직관", "창의", "소통"],
  ["행운", "기회", "변화"],
  ["안정", "성취", "협력"],
  ["열정", "도전", "성공"],
  ["휴식", "성찰", "재충전"],
  ["인맥", "금전", "건강"],
  ["로맨스", "자신감", "명확함"],
  ["인내", "배려", "화해"],
  ["학습", "집중", "발전"],
  ["모험", "새출발", "자유"],
  ["감사", "소박함", "평화"],
  ["결단", "실행력", "추진력"],
  ["유연함", "적응", "수용"],
  ["정리", "마무리", "완성"],
];

function buildSeedFallback(dateStr: string, shuffled: (typeof ZODIAC_SIGNS)[number][]): OhahasaResult {
  const LUCKY_COLORS = ["골드", "라벤더", "스카이블루", "민트", "코랄", "퍼플"];
  const LUCKY_ITEMS = ["수정", "향초", "책", "꽃", "음악", "일기"];
  const LUCKY_TIMES = ["오전 9시", "오후 2시", "저녁 6시", "새벽", "낮", "오후"];
  const CAUTION_TIMES = ["오후 3시", "새벽 2시", "점심 직후", "저녁 8시", "오전 11시", "밤 10시"];
  const HEADLINE_TEMPLATES = [
    "오늘은 균형만 지키면 무난하게 풀립니다.",
    "작은 기회를 놓치지 마세요.",
    "소통이 빛나는 하루예요.",
    "차분히 한 걸음씩 나아가세요.",
    "휴식도 오늘의 일정에 넣어보세요.",
    "직관을 믿어 보세요.",
  ];
  const OVERVIEW_TEMPLATES = [
    "오늘은 전반적으로 긍정적인 에너지가 흐르는 날입니다. 작은 기회를 놓치지 마세요.",
    "주변과의 소통이 활발해질 수 있어요. 마음을 열고 대화해 보세요.",
    "계획을 세우고 차근차근 진행하면 좋은 결과를 얻을 수 있습니다.",
    "건강에 조금 더 신경 쓰면 좋겠어요. 휴식도 중요합니다.",
    "금전운이 무난한 편입니다. 불필요한 지출은 삼가세요.",
    "오늘은 직관이 예민해지는 날이에요. 내 몸의 신호를 믿어 보세요.",
    "과거에 미뤄둔 일을 마무리하기 좋은 타이밍입니다.",
  ];
  const ONE_LINE_TEMPLATES = [
    "오늘은 {krName}자리에게 좋은 에너지가 흐르는 날이에요.",
    "{krName}자리, 소통과 협력이 빛나는 하루입니다.",
    "작은 기회를 놓치지 마세요. {krName}자리에게 유리한 흐름.",
    "{krName}자리, 직관을 믿고 나아가 보세요.",
  ];
  const DO_POOLS = [
    ["긍정적인 마음 유지", "소통하기"],
    ["계획 세우기", "작은 것부터 실행하기"],
    ["휴식 취하기", "몸에 귀 기울이기"],
    ["솔직한 대화", "경청하기"],
  ];
  const DONT_POOLS = [
    ["성급한 결정", "감정적인 반응"],
    ["불필요한 지출", "충동 구매"],
    ["과로", "무리한 일정"],
    ["오해를 키우는 말", "비판적인 태도"],
  ];

  const items: OhahasaItem[] = shuffled.map((s, i) => {
    const baseSeed = `${dateStr}-${s.slug}`;
    const score = Math.max(0, Math.min(100, 100 - i * 8 + (hashString(baseSeed) % 5)));
    const overview = OVERVIEW_TEMPLATES[hashString(baseSeed) % OVERVIEW_TEMPLATES.length]!;
    const oneLine = ONE_LINE_TEMPLATES[hashString(baseSeed + "ol") % ONE_LINE_TEMPLATES.length]!.replace("{krName}", s.krName);
    const kwPool = KEYWORD_POOLS[hashString(baseSeed + "kw") % KEYWORD_POOLS.length]!;
    const luckyTime = LUCKY_TIMES[hashString(baseSeed + "t") % LUCKY_TIMES.length]!;
    const cautionTime = CAUTION_TIMES[hashString(baseSeed + "ct") % CAUTION_TIMES.length]!;
    const headline = HEADLINE_TEMPLATES[hashString(baseSeed + "hl") % HEADLINE_TEMPLATES.length]!;

    return {
      sign: { slug: s.slug, krName: s.krName },
      rank: i + 1,
      score,
      oneLine,
      keywords: kwPool,
      lucky: {
        color: LUCKY_COLORS[hashString(baseSeed + "c") % LUCKY_COLORS.length]!,
        number: String((hashString(baseSeed + "n") % 9) + 1),
        item: LUCKY_ITEMS[hashString(baseSeed + "i") % LUCKY_ITEMS.length]!,
        time: luckyTime,
        luckyTime,
        cautionTime,
      },
      breakdown: buildSeedBreakdown(baseSeed),
      deltaRank: null,
      deltaScore: null,
      headline,
      overview,
      do: DO_POOLS[hashString(baseSeed + "do") % DO_POOLS.length]!,
      dont: DONT_POOLS[hashString(baseSeed + "dont") % DONT_POOLS.length]!,
    };
  });

  const ranking: OhahasaRankItem[] = items.map((it) => ({
    rank: it.rank,
    sign: it.sign,
    score: it.score,
    oneLiner: it.oneLine,
    keywords: it.keywords,
    lucky: {
      color: it.lucky.color,
      number: it.lucky.number,
      item: it.lucky.item,
      place: it.lucky.luckyTime ?? it.lucky.time ?? "오전",
    },
    do: it.do,
    dont: it.dont,
  }));

  return {
    date: dateStr,
    title: `${format(new Date(dateStr), "yyyy년 M월 d일", { locale: ko })} 오하아사`,
    items,
    notes: "오늘의 에너지를 긍정적으로 활용해 보세요.",
    ranking,
  };
}

export async function POST(req: NextRequest) {
  const clientId = getClientId(req);
  if (!checkRateLimit(clientId)) {
    return NextResponse.json({ error: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요." }, { status: 429 });
  }

  try {
    let body: { date?: string } = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    const dateStr = body.date ?? format(new Date(), "yyyy-MM-dd");

    // ✅ 1) 키 없으면: DB/OPENAI 절대 안 타고 즉시 fallback
    if (!hasOpenAIKey()) {
      logDemoModeOnce();
      const seed = `${dateStr}-${SECRET_SALT}`;
      const shuffled = seededShuffle([...ZODIAC_SIGNS], seed);
      const result = buildSeedFallback(dateStr, shuffled);
      incrementRate(clientId);
      return NextResponse.json({ ...result, meta: { demo: true, reason: "no_openai_key" } });
    }

    // ---- 아래부터는 키가 있을 때만 진행(원래 로직) ----
    let cached: { payload: string } | null = null;
    try {
      cached = await prisma.dailyOhahasa.findUnique({ where: { date: dateStr } });
    } catch (dbErr) {
      console.error("Ohahasa DB read error:", dbErr);
    }

    if (cached) {
      try {
        const payload = JSON.parse(cached.payload) as unknown;
        const result = normalizeCachedPayload(payload);

        const yesterdayStr = format(sub(new Date(dateStr), { days: 1 }), "yyyy-MM-dd");
        let yesterdayCached: { payload: string } | null = null;
        try {
          yesterdayCached = await prisma.dailyOhahasa.findUnique({ where: { date: yesterdayStr } });
        } catch {
          /* ignore */
        }

        if (yesterdayCached && result.items[0]?.deltaRank === null) {
          try {
            const yesterdayPayload = JSON.parse(yesterdayCached.payload) as unknown;
            const yesterdayResult = normalizeCachedPayload(yesterdayPayload);
            const yesterdayRankMap = getYesterdayRankMap(yesterdayResult.items);
            const yesterdayScoreMap = getYesterdayScoreMap(yesterdayResult.items);
            result.items = result.items.map((it) => {
              const prevRank = yesterdayRankMap.get(it.sign.slug);
              const prevScore = yesterdayScoreMap.get(it.sign.slug);
              return {
                ...it,
                deltaRank: prevRank != null ? prevRank - it.rank : null,
                deltaScore: prevScore != null ? it.score - prevScore : null,
              };
            });

            await prisma.dailyOhahasa.update({
              where: { date: dateStr },
              data: { payload: JSON.stringify(result) },
            });
          } catch (updateErr) {
            console.error("Ohahasa deltaRank update error:", updateErr);
          }
        }

        incrementRate(clientId);
        return NextResponse.json(result);
      } catch (e) {
        console.error("Ohahasa cache parse error:", e);
      }
    }

    const seed = `${dateStr}-${SECRET_SALT}`;
    const shuffled = seededShuffle([...ZODIAC_SIGNS], seed);

    let result: OhahasaResult;
    let usedFallback = false;

    if (!isDemoMode()) {
      try {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        const signsList = shuffled.map((s, i) => `${i + 1}위: ${s.krName}자리`).join(", ");

        const prompt = `오하아사(별자리 운세 순위)입니다. ${dateStr} 기준 12별자리 순위가 아래와 같습니다.

순위: ${signsList}

각 별자리별로 다음을 JSON으로 작성해 주세요:
- oneLine: 한 줄 운세
- keywords: 키워드 3개
- headline: 오늘의 한 문장
- overview: 총운 본문 5~8문장 (12개 별자리는 다양하게)
- lucky: { color, number, item, luckyTime, cautionTime }
- breakdown: love/money/studyOrCareer/health/relations 각각 { score, comment }
- do: 추천 2개, dont: 주의 2개

반드시 아래 JSON 구조만 반환:
{
  "date": "${dateStr}",
  "title": "${format(new Date(dateStr), "yyyy년 M월 d일", { locale: ko })} 오하아사",
  "items": [ ...12개... ],
  "notes": "오늘 전체 분위기 한 문단"
}

slug는 aquarius, pisces, aries, taurus, gemini, cancer, leo, virgo, libra, scorpio, sagittarius, capricorn 중 하나.`;

        const completion = await withTimeout(
          openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
          }),
          9000
        );

        const content = completion.choices[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content) as OhahasaResult;
          if (parsed.items?.length === 12) {
            result = {
              date: dateStr,
              title: parsed.title ?? `${format(new Date(dateStr), "yyyy년 M월 d일", { locale: ko })} 오하아사`,
              items: parsed.items.map((r, i) => {
                const baseSeed = `${dateStr}-${shuffled[i]!.slug}`;
                const luckyTime =
                  (r.lucky as { luckyTime?: string })?.luckyTime ?? r.lucky?.time ?? "오전";
                const cautionTime = (r.lucky as { cautionTime?: string | null })?.cautionTime ?? null;
                return {
                  sign: r.sign ?? { slug: shuffled[i]!.slug, krName: shuffled[i]!.krName },
                  rank: i + 1,
                  score: Math.min(100, Math.max(0, r.score ?? 70 - i * 5)),
                  oneLine: r.oneLine ?? (r as any).oneLiner ?? "",
                  keywords: r.keywords?.slice(0, 3) ?? ["에너지", "성장", "균형"],
                  lucky: {
                    color: r.lucky?.color ?? "골드",
                    number: String(r.lucky?.number ?? i + 1),
                    item: r.lucky?.item ?? "미정",
                    time: luckyTime,
                    luckyTime,
                    cautionTime,
                  },
                  breakdown: r.breakdown ?? buildSeedBreakdown(baseSeed),
                  deltaRank: null,
                  deltaScore: null,
                  headline: (r as OhahasaItem).headline ?? extractHeadline(r.overview),
                  overview: r.overview,
                  do: r.do,
                  dont: r.dont,
                };
              }),
              notes: parsed.notes ?? "오늘의 에너지를 긍정적으로 활용해 보세요.",
              ranking: undefined,
            };
          } else {
            usedFallback = true;
            result = buildSeedFallback(dateStr, shuffled);
          }
        } else {
          usedFallback = true;
          result = buildSeedFallback(dateStr, shuffled);
        }
      } catch (e) {
        console.error("ohahasa openai error:", e);
        usedFallback = true;
        result = buildSeedFallback(dateStr, shuffled);
      }
    } else {
      logDemoModeOnce();
      usedFallback = true;
      result = buildSeedFallback(dateStr, shuffled);
    }

    // yesterday delta (DB가 있으면)
    try {
      const yesterdayStr = format(sub(new Date(dateStr), { days: 1 }), "yyyy-MM-dd");
      const yesterdayCached = await prisma.dailyOhahasa.findUnique({ where: { date: yesterdayStr } });
      if (yesterdayCached) {
        const yesterdayPayload = JSON.parse(yesterdayCached.payload) as unknown;
        const yesterdayResult = normalizeCachedPayload(yesterdayPayload);
        const yesterdayRankMap = getYesterdayRankMap(yesterdayResult.items);
        const yesterdayScoreMap = getYesterdayScoreMap(yesterdayResult.items);
        result.items = result.items.map((it) => {
          const prevRank = yesterdayRankMap.get(it.sign.slug);
          const prevScore = yesterdayScoreMap.get(it.sign.slug);
          return {
            ...it,
            deltaRank: prevRank != null ? prevRank - it.rank : null,
            deltaScore: prevScore != null ? it.score - prevScore : null,
          };
        });
      }
    } catch (e) {
      console.error("ohahasa yesterday db error:", e);
    }

    // ranking 채우기
    if (!result.ranking && result.items?.length) {
      result.ranking = result.items.map((it) => ({
        rank: it.rank,
        sign: it.sign,
        score: it.score,
        oneLiner: it.oneLine,
        keywords: it.keywords,
        lucky: {
          color: it.lucky.color,
          number: it.lucky.number,
          item: it.lucky.item,
          place: it.lucky.luckyTime ?? it.lucky.time ?? "오전",
        },
        do: it.do,
        dont: it.dont,
      }));
    }

    // cache upsert
    try {
      await prisma.dailyOhahasa.upsert({
        where: { date: dateStr },
        create: { date: dateStr, payload: JSON.stringify(result) },
        update: { payload: JSON.stringify(result) },
      });
    } catch (e) {
      console.error("ohahasa db upsert error:", e);
    }

    incrementRate(clientId);
    return NextResponse.json(usedFallback ? { ...result, meta: { demo: true } } : result);
  } catch (e) {
    console.error("ohahasa route error:", e);
    logDemoModeOnce();
    const dateStr = format(new Date(), "yyyy-MM-dd");
    const seed = `${dateStr}-${SECRET_SALT}`;
    const shuffled = seededShuffle([...ZODIAC_SIGNS], seed);
    const result = buildSeedFallback(dateStr, shuffled);
    incrementRate(clientId);
    return NextResponse.json({ ...result, meta: { demo: true } });
  }
}