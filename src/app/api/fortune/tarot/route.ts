import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import tarotData from "@/data/tarot.json";
import { seededShuffle, hashString } from "@/lib/seed";
import type { TarotResult, TarotCardResult, TarotSpread } from "@/types/fortune";

type TarotCard = (typeof tarotData)[number];

const RATE_LIMIT = 10;
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

function buildSeed(
  date: string,
  profile: { birth?: string; name?: string },
  spread: TarotSpread,
  question: string,
  rerollCount: number
): string {
  const base = `${date}|${profile.birth ?? ""}|${profile.name ?? ""}|${spread}|${question ?? ""}`;
  return rerollCount > 0 ? `${base}|reroll:${rerollCount}` : base;
}

function pickCards(
  spread: TarotSpread,
  seed: string
): { card: TarotCard; isReversed: boolean; position?: "past" | "present" | "future" }[] {
  const shuffled = seededShuffle(tarotData as TarotCard[], seed);
  const count = spread === "three_past_present_future" ? 3 : 1;
  const positions: ("past" | "present" | "future")[] = ["past", "present", "future"];
  return shuffled.slice(0, count).map((card, i) => ({
    card,
    isReversed: false,
    position: spread === "three_past_present_future" ? positions[i] : undefined,
  }));
}

function buildFallback(
  date: string,
  spread: TarotSpread,
  question: string | undefined,
  picked: { card: TarotCard; isReversed: boolean; position?: "past" | "present" | "future" }[]
): TarotResult {
  const headlines = [
    "지금은 속도를 늦추는 게 이득입니다.",
    "직관을 믿고 한 걸음 내딛어 보세요.",
    "오늘은 작은 기쁨에 집중하는 것이 좋겠습니다.",
    "변화의 시기가 다가오고 있습니다.",
    "침착함이 당신을 도울 것입니다.",
  ];
  const h = hashString(date + spread + (question ?? "")) % headlines.length;
  const headline = headlines[h] ?? headlines[0]!;

  const summaries = [
    "뽑힌 카드들이 오늘의 흐름을 잘 보여주고 있습니다. 각 카드의 의미를 곱씹어 보시면 도움이 될 것입니다.",
    "카드들이 전하고자 하는 메시지를 마음에 새겨 보세요. 참고용으로 활용하시면 좋겠습니다.",
    "오늘의 에너지가 카드를 통해 드러났습니다. 가볍게 받아들이시면 됩니다.",
  ];
  const s = hashString(date + "summary") % summaries.length;
  const summary = summaries[s] ?? summaries[0]!;

  const advices = [
    "오늘 한 가지 좋은 일을 기록해 보세요.",
    "가까운 사람에게 연락해 보세요.",
    "잠시 쉬어가는 것도 좋은 선택입니다.",
    "직관이 이끄는 대로 따라가 보세요.",
  ];
  const a = hashString(date + "advice") % advices.length;
  const advice = advices[a] ?? advices[0]!;

  const cautions = [
    "성급한 결정은 피하세요.",
    "과한 기대는 부담이 될 수 있습니다.",
    "오늘은 무리하지 않는 것이 좋습니다.",
  ];
  const c = hashString(date + "caution") % cautions.length;
  const caution = cautions[c];

  const cards: TarotCardResult[] = picked.map(({ card, position }) => {
    const meaning = (card as { upright?: string }).upright;
    const kw = (card as TarotCard).keywords ?? [];
    const keywords = Array.isArray(kw) ? kw.slice(0, 3).map(String) : ["참고", "성찰", "균형"];
    const interpretation = `${(card as TarotCard).krName} - ${meaning}. 이 카드는 ${keywords.join(", ")}의 에너지를 담고 있습니다.`;
    return {
      id: (card as TarotCard).id ?? (card as TarotCard).name,
      name: (card as TarotCard).krName ?? (card as TarotCard).name,
      isReversed: false,
      position,
      keywords,
      interpretation,
    };
  });

  return {
    date,
    spread,
    question: question || undefined,
    headline,
    summary,
    advice,
    caution,
    cards,
  };
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
    const body = (await req.json()) as Record<string, unknown>;
    const spread = (body.spread as TarotSpread) ?? "single";
    const question = (body.question as string)?.trim() || undefined;
    const rerollCount = Number(body.rerollCount) || 0;
    const profileSnapshot = body.profileSnapshot as { birth?: string; name?: string; interests?: string[] } | undefined;
    const profile = profileSnapshot ?? { birth: "", name: "" };

    const date = new Date().toISOString().slice(0, 10);
    const seed = buildSeed(date, profile, spread, question ?? "", rerollCount);
    const picked = pickCards(spread, seed);

    if (process.env.OPENAI_API_KEY) {
      try {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const cardsDesc = picked
          .map(
            (p, i) =>
              `${i + 1}. ${p.card.krName}(${p.card.name}) - 정방향${p.position ? ` [${p.position}]` : ""}`
          )
          .join("\n");

        const prompt = `타로 카드 해석을 JSON으로 작성해 주세요.

뽑힌 카드:
${cardsDesc}

질문(없으면 비워둠): ${question ?? ""}

규칙: 한국어, 과한 오글거림 금지, 단정적 투자/의료/법률 조언 금지. 점괘는 참고용 톤.

반드시 아래 JSON만 반환:
{
  "headline": "한 줄 요약 (예: 지금은 속도를 늦추는 게 이득입니다.)",
  "summary": "전체 요약 3~6문장 문단",
  "advice": "오늘의 추천 행동 1문장",
  "caution": "주의 1문장 (선택)",
  "cards": [
    {
      "id": "카드id",
      "name": "한국어 카드명",
      "isReversed": false (항상 정방향),
      "position": "past|present|future (3장일 때만)",
      "keywords": ["키워드1","키워드2","키워드3"],
      "interpretation": "2~5문장 해석"
    }
  ]
}`;

        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
        });

        const content = completion.choices[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content) as Partial<TarotResult>;
          const cards: TarotCardResult[] = (parsed.cards ?? []).map((c, i) => ({
            id: String(c.id ?? picked[i]!.card.id ?? picked[i]!.card.name),
            name: String(c.name ?? picked[i]!.card.krName),
            isReversed: false,
            position: c.position ?? picked[i]!.position,
            keywords: Array.isArray(c.keywords) ? c.keywords.slice(0, 3).map(String) : [],
            interpretation: String(c.interpretation ?? ""),
          }));

          const result: TarotResult = {
            date,
            spread,
            question,
            headline: String(parsed.headline ?? "오늘의 메시지를 확인해 보세요."),
            summary: String(parsed.summary ?? ""),
            advice: String(parsed.advice ?? "가볍게 받아들이세요."),
            caution: parsed.caution ? String(parsed.caution) : undefined,
            cards,
          };
          incrementRate(clientId);
          return NextResponse.json(result);
        }
      } catch (e) {
        console.error(e);
      }
    }

    const fallback = buildFallback(date, spread, question, picked);
    incrementRate(clientId);
    return NextResponse.json(fallback);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "타로 해석에 실패했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 }
    );
  }
}
