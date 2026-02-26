import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import { ZODIAC_SIGNS } from "@/data/zodiac";
import { seededShuffle, hashString } from "@/lib/seed";
import { format, sub } from "date-fns";
import { ko } from "date-fns/locale";
import type {
  OhahasaResult,
  OhahasaItem,
  OhahasaResponse,
  OhahasaRankItem,
} from "@/types/fortune";

const SECRET_SALT = process.env.OHAHASA_SALT ?? "fortune-ohahasa-default";

const RATE_LIMIT = 20;
const rateMap = new Map<string, { count: number; resetAt: number }>();

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

/** 캐시에서 읽은 payload를 OhahasaResult로 정규화 */
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
    const sign = r.sign ?? { slug: ZODIAC_SIGNS[i]?.slug ?? "aquarius", krName: ZODIAC_SIGNS[i]?.krName ?? "물병" };
    const baseSeed = `${dateStr}-${sign.slug}`;
    const score = r.score ?? Math.max(0, 100 - i * 8);
    const luckyTimeVal = (r.lucky as { luckyTime?: string })?.luckyTime ?? (r.lucky as { time?: string })?.time ?? r.lucky?.place ?? "오전";
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

/** 분야별 행동 팁 (바로 실행 가능한 1문장) */
const ACTION_TIPS: Record<keyof OhahasaItem["breakdown"], string[]> = {
  love: [
    "먼저 가벼운 안부 톡이 유리해요.",
    "오늘은 고백보다는 대화가 좋아요.",
    "연인과의 짧은 식사 시간을 가져보세요.",
    "데이트 계획은 미리 정해두면 좋아요.",
    "솔직한 메시지 한 통이 관계를 끌어올려요.",
    "오래된 인연에게 연락해 보세요.",
    "로맨틱한 분위기보다는 편안한 대화가 좋아요.",
    "연애 관련 결정은 내일로 미뤄보세요.",
    "새로운 만남의 기운, 오픈한 자세로.",
    "과거에 대한 대화는 나중에 하는 게 좋아요.",
  ],
  money: [
    "충동구매는 오후에 특히 주의하세요.",
    "오늘은 큰 지출 결정을 미루세요.",
    "저축 계좌에 소액이라도 넣어보세요.",
    "영수증은 꼭 확인하고 보관하세요.",
    "협상이나 계약은 오전에 진행하세요.",
    "불필요한 구독은 오늘 정리해 보세요.",
    "예산을 한 번 점검해 보세요.",
    "보너스는 30% 이상 저축하는 게 좋아요.",
    "투자보다는 안정적인 관리가 유리해요.",
    "오늘은 현금보다 카드 사용이 좋아요.",
  ],
  studyOrCareer: [
    "회의/협업 정리는 오전에 하면 효과적이에요.",
    "중요한 작업은 오전 10시 전에 시작하세요.",
    "복습은 30분 단위로 나눠 하세요.",
    "발표/면접은 오후보다 오전이 유리해요.",
    "메모를 한 줄로 정리하는 습관을 들이세요.",
    "동료에게 한 가지 질문을 던져보세요.",
    "할 일 목록을 3개만 정해 보세요.",
    "이메일/메시지는 2회 이내로 답하세요.",
    "새 프로젝트 시작은 내일로 미뤄보세요.",
    "점심 후 10분 산책이 집중력을 높여요.",
  ],
  health: [
    "10분 스트레칭이 컨디션을 끌어올려요.",
    "물을 하루 8잔 이상 마시세요.",
    "오후 3시에 5분 눈 감고 휴식하세요.",
    "저녁 식사는 7시 전에 마치세요.",
    "잠들기 1시간 전에 스마트폰을 멀리하세요.",
    "가벼운 산책 20분이 도움돼요.",
    "과식은 피하고 소량을 여러 번 드세요.",
    "어깨/목 스트레칭을 3회 이상 하세요.",
    "커피는 오후 2시 이후 피하세요.",
    "취침 시간을 30분 앞당겨 보세요.",
  ],
  relations: [
    "부탁은 짧고 명확하게 말하면 오해가 줄어요.",
    "오늘은 경청보다 말하기가 더 중요해요.",
    "오랜 친구에게 연락 한 통 보내보세요.",
    "가족과의 대화 시간 10분을 확보하세요.",
    "동료에게 한 가지 칭찬을 건네보세요.",
    "오해가 생기면 바로 확인하는 게 좋아요.",
    "SNS보다는 전화 한 통이 관계를 돈독히 해요.",
    "부탁을 거절할 때는 이유를 짧게 말하세요.",
    "모임에서는 한 사람에게 집중하세요.",
    "피드백은 1:1로 전달하는 게 좋아요.",
  ],
};

function buildSeedBreakdown(seed: string): OhahasaItem["breakdown"] {
  const keys: (keyof OhahasaItem["breakdown"])[] = [
    "love",
    "money",
    "studyOrCareer",
    "health",
    "relations",
  ];
  const entries = keys.map((key) => {
    const h = hashString(seed + key);
    const score = Math.min(100, Math.max(0, (h % 30) + 60));
    const tips = ACTION_TIPS[key];
    const comment = tips[h % tips.length] ?? tips[0];
    return [key, { score, comment }] as const;
  });
  return Object.fromEntries(entries) as unknown as OhahasaItem["breakdown"];
}

/** 어제 순위 맵 (slug -> rank) */
function getYesterdayRankMap(yesterdayItems: OhahasaItem[]): Map<string, number> {
  const m = new Map<string, number>();
  yesterdayItems.forEach((it) => m.set(it.sign.slug, it.rank));
  return m;
}

/** 어제 점수 맵 (slug -> score) */
function getYesterdayScoreMap(yesterdayItems: OhahasaItem[]): Map<string, number> {
  const m = new Map<string, number>();
  yesterdayItems.forEach((it) => m.set(it.sign.slug, it.score));
  return m;
}

/** 총운 첫 문장에서 시그니처 추출 (마침표/줄바꿈 기준) */
function extractHeadline(overview: string | undefined): string {
  if (!overview?.trim()) return "오늘은 균형만 지키면 무난하게 풀립니다.";
  const first = overview.split(/[.\n]/)[0]?.trim();
  return first && first.length > 5 ? first + (first.endsWith("요") || first.endsWith("다") ? "" : ".") : "오늘은 균형만 지키면 무난하게 풀립니다.";
}

export async function POST(req: NextRequest) {
  const clientId = getClientId(req);
  if (!checkRateLimit(clientId)) {
    return NextResponse.json(
      { error: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요." },
      { status: 429 }
    );
  }

  try {
    let body: { date?: string } = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    const dateStr = body.date ?? format(new Date(), "yyyy-MM-dd");

    let cached: { payload: string } | null = null;
    try {
      cached = await prisma.dailyOhahasa.findUnique({
        where: { date: dateStr },
      });
    } catch (dbErr) {
      console.error("Ohahasa DB read error:", dbErr);
    }

    if (cached) {
      let payload: unknown;
      try {
        payload = JSON.parse(cached.payload);
      } catch (parseErr) {
        console.error("Ohahasa cache JSON parse error:", parseErr);
        cached = null;
      }
      if (cached && payload !== undefined) {
        const result = normalizeCachedPayload(payload);
        const yesterdayStr = format(sub(new Date(dateStr), { days: 1 }), "yyyy-MM-dd");
        let yesterdayCached: { payload: string } | null = null;
        try {
          yesterdayCached = await prisma.dailyOhahasa.findUnique({
            where: { date: yesterdayStr },
          });
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
      }
    }

    const seed = `${dateStr}-${SECRET_SALT}`;
    const shuffled = seededShuffle([...ZODIAC_SIGNS], seed);

    let result: OhahasaResult;

    if (process.env.OPENAI_API_KEY) {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const signsList = shuffled
        .map((s, i) => `${i + 1}위: ${s.krName}자리`)
        .join(", ");

      const prompt = `오하아사(별자리 운세 순위)입니다. ${dateStr} 기준 12별자리 순위가 아래와 같습니다.

순위: ${signsList}

각 별자리별로 다음을 JSON으로 작성해 주세요:
- oneLine: 한 줄 운세 (별자리마다 분명히 다른 표현 사용)
- keywords: 키워드 3개 (반복 최소화)
- headline: 오늘의 한 문장 시그니처 (굵고 짧게, 예: "오늘은 균형만 지키면 무난하게 풀립니다.")
- overview: 총운 본문 5~8문장. **중요**: 12개 별자리 총운은 반드시 다양한 스펙트럼으로 작성하세요.
- lucky: { color, number, item, luckyTime, cautionTime } - luckyTime=좋은 시간대, cautionTime=주의 시간대 (예: "오후 2시", "새벽")
- breakdown: { love, money, studyOrCareer, health, relations } 각각 { score: 0~100, comment: "바로 실행 가능한 행동 팁 1문장" } (예: "먼저 가벼운 안부 톡이 유리해요.")
- do: 추천 2개, dont: 주의 2개 (별자리마다 다른 내용)

반드시 아래 JSON 구조만 반환 (배열 순서는 위 순위 그대로):
{
  "date": "${dateStr}",
  "title": "${format(new Date(dateStr), "yyyy년 M월 d일", { locale: ko })} 오하아사",
  "items": [
    {
      "sign": {"slug":"영문슬러그","krName":"한국어명"},
      "rank": 1,
      "score": 85,
      "oneLine": "한 줄 운세",
      "keywords": ["키워드1","키워드2","키워드3"],
      "headline": "오늘의 한 문장",
      "overview": "총운 본문 5~8문장...",
      "lucky": {"color":"","number":"","item":"","luckyTime":"","cautionTime":""},
      "breakdown": {
        "love": {"score":80,"comment":"짧은 코멘트"},
        "money": {"score":75,"comment":"짧은 코멘트"},
        "studyOrCareer": {"score":70,"comment":"짧은 코멘트"},
        "health": {"score":65,"comment":"짧은 코멘트"},
        "relations": {"score":90,"comment":"짧은 코멘트"}
      },
      "do": ["추천1","추천2"],
      "dont": ["주의1","주의2"]
    }
  ],
  "notes": "오늘 전체 분위기 한 문단"
}

slug는 aquarius, pisces, aries, taurus, gemini, cancer, leo, virgo, libra, scorpio, sagittarius, capricorn 중 하나. 순위의 별자리와 정확히 매칭되게.`;

      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
        });

        const content = completion.choices[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content) as OhahasaResult;
          if (parsed.items?.length === 12) {
            result = {
              date: dateStr,
              title: parsed.title ?? `${format(new Date(dateStr), "yyyy년 M월 d일", { locale: ko })} 오하아사`,
              items: parsed.items.map((r, i) => {
                const baseSeed = `${dateStr}-${shuffled[i]!.slug}`;
                const luckyTime = (r.lucky as { luckyTime?: string })?.luckyTime ?? r.lucky?.time ?? "오전";
                const cautionTime = (r.lucky as { cautionTime?: string | null })?.cautionTime ?? null;
                return {
                  sign: r.sign ?? { slug: shuffled[i]!.slug, krName: shuffled[i]!.krName },
                  rank: i + 1,
                  score: Math.min(100, Math.max(0, r.score ?? 70 - i * 5)),
                  oneLine: r.oneLine ?? r.oneLiner ?? "",
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
            };
          } else {
            result = buildSeedFallback(dateStr, shuffled);
          }
        } else {
          result = buildSeedFallback(dateStr, shuffled);
        }
      } catch {
        result = buildSeedFallback(dateStr, shuffled);
      }
    } else {
      result = buildSeedFallback(dateStr, shuffled);
    }

    const yesterdayStr = format(sub(new Date(dateStr), { days: 1 }), "yyyy-MM-dd");
    const yesterdayCached = await prisma.dailyOhahasa.findUnique({
      where: { date: yesterdayStr },
    });
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

    await prisma.dailyOhahasa.upsert({
      where: { date: dateStr },
      create: { date: dateStr, payload: JSON.stringify(result) },
      update: { payload: JSON.stringify(result) },
    });

    incrementRate(clientId);
    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "오하아사 생성에 실패했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 }
    );
  }
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

function buildSeedFallback(
  dateStr: string,
  shuffled: (typeof ZODIAC_SIGNS)[number][]
): OhahasaResult {
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
    "주변과의 조화가 중요해요.",
    "계획을 세우고 실행하는 날.",
    "건강에 조금 더 신경 쓰세요.",
    "금전 결정은 내일로 미뤄보세요.",
  ];
  const OVERVIEW_TEMPLATES = [
    "오늘은 전반적으로 긍정적인 에너지가 흐르는 날입니다. 작은 기회를 놓치지 마세요.",
    "주변과의 소통이 활발해질 수 있어요. 마음을 열고 대화해 보세요.",
    "계획을 세우고 차근차근 진행하면 좋은 결과를 얻을 수 있습니다.",
    "건강에 조금 더 신경 쓰면 좋겠어요. 휴식도 중요합니다.",
    "금전운이 무난한 편입니다. 불필요한 지출은 삼가세요.",
    "오늘은 직관이 예민해지는 날이에요. 첫인상이나 몸의 신호를 믿어 보세요.",
    "새로운 시작에 적합한 에너지가 모여 있어요. 망설이던 일을 실행해 보세요.",
    "인간관계에서 작은 양보가 큰 결실로 이어질 수 있어요.",
    "예상치 못한 제안이나 연락이 올 수 있어요. 열린 자세로 응해 보세요.",
    "과거에 미뤄둔 일을 마무리하기 좋은 타이밍입니다.",
    "오늘은 혼자만의 시간이 필요할 수 있어요. 재충전에 집중하세요.",
    "창의적인 일이나 예술 활동에 유리한 흐름이에요.",
    "건강한 식습관과 규칙적인 운동이 오늘의 운을 높여 줍니다.",
    "주변의 조언을 귀 기울여 들으면 도움이 됩니다.",
    "오늘은 감정 기복이 있을 수 있어요. 중요한 결정은 미루세요.",
    "학업이나 업무에서 집중력이 올라가는 시기입니다.",
    "로맨스에 유리한 분위기예요. 마음을 표현해 보세요.",
    "재정 관련 계약이나 협상에 유리한 날입니다.",
    "스트레스가 쌓일 수 있어요. 취미나 휴식으로 해소하세요.",
    "오랜 인연과의 재회나 화해의 기운이 있어요.",
    "새로운 사람을 만나거나 네트워크가 넓어질 수 있어요.",
    "오늘은 조용히 성찰하기 좋은 날입니다. 내면의 목소리에 귀 기울이세요.",
    "도전적인 일에 도전해 보세요. 예상보다 좋은 결과가 있을 수 있어요.",
    "가족이나 가까운 사람과의 시간이 소중한 날이에요.",
    "불필요한 말다툼은 피하는 게 좋아요. 침착함을 유지하세요.",
    "작은 성취가 쌓여 만족스러운 하루가 될 수 있어요.",
  ];
  const ONE_LINE_TEMPLATES = [
    "오늘은 {krName}자리에게 좋은 에너지가 흐르는 날이에요.",
    "{krName}자리, 소통과 협력이 빛나는 하루입니다.",
    "작은 기회를 놓치지 마세요. {krName}자리에게 유리한 흐름.",
    "{krName}자리, 직관을 믿고 나아가 보세요.",
    "오늘 {krName}자리는 새로운 시작에 적합한 기운이에요.",
    "{krName}자리에게 인맥과 협력이 행운을 불러올 수 있어요.",
    "차분한 마음으로 하루를 보내면 좋겠어요, {krName}자리.",
    "{krName}자리, 창의력이 빛나는 날입니다.",
    "오늘 {krName}자리는 재충전이 필요한 하루일 수 있어요.",
    "{krName}자리에게 로맨틱한 에너지가 흐르는 날이에요.",
  ];
  const DO_POOLS = [
    ["긍정적인 마음 유지", "소통하기"],
    ["계획 세우기", "작은 것부터 실행하기"],
    ["휴식 취하기", "몸에 귀 기울이기"],
    ["솔직한 대화", "경청하기"],
    ["새로운 시도", "도전하기"],
    ["정리와 정돈", "과거 정리하기"],
    ["독서나 공부", "지식 쌓기"],
    ["산책이나 운동", "활동하기"],
    ["감사 표현하기", "주변에 배려하기"],
    ["목표 재점검", "우선순위 정하기"],
  ];
  const DONT_POOLS = [
    ["성급한 결정", "감정적인 반응"],
    ["불필요한 지출", "충동 구매"],
    ["과로", "무리한 일정"],
    ["오해를 키우는 말", "비판적인 태도"],
    ["새로운 투자", "위험한 도박"],
    ["혼자 모든 걸 떠맡기", "고집 부리기"],
    ["미루기", "회피하기"],
    ["과한 기대", "완벽주의"],
    ["불평불만", "비관적 생각"],
    ["무시하기", "무관심"],
  ];

  const items: OhahasaItem[] = shuffled.map((s, i) => {
      const baseSeed = `${dateStr}-${s.slug}`;
      const score = Math.max(0, Math.min(100, 100 - i * 8 + (hashString(baseSeed) % 5)));
      const overviewIdx = hashString(baseSeed) % OVERVIEW_TEMPLATES.length;
      const oneLineIdx = hashString(baseSeed + "ol") % ONE_LINE_TEMPLATES.length;
      const kwPool = KEYWORD_POOLS[hashString(baseSeed + "kw") % KEYWORD_POOLS.length]!;
      const luckyTime = LUCKY_TIMES[hashString(baseSeed + "t") % LUCKY_TIMES.length]!;
      const cautionTime = CAUTION_TIMES[hashString(baseSeed + "ct") % CAUTION_TIMES.length]!;
      const overview = OVERVIEW_TEMPLATES[overviewIdx];
      const headline = HEADLINE_TEMPLATES[hashString(baseSeed + "hl") % HEADLINE_TEMPLATES.length]!;
      return {
        sign: { slug: s.slug, krName: s.krName },
        rank: i + 1,
        score,
        oneLine: ONE_LINE_TEMPLATES[oneLineIdx]!.replace("{krName}", s.krName),
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
