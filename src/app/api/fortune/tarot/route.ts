import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import tarotData from "@/data/tarot.json";
import { seededShuffle } from "@/lib/seed";
import type { TarotResponse } from "@/types/fortune";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

type TarotCard = (typeof tarotData)[number];

export async function POST(req: NextRequest) {
  const clientId = getClientId(req);
  if (!checkRateLimit(clientId)) {
    return NextResponse.json(
      { error: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const { spread = "one-card", question = "", seed: userSeed } = body;
    const seed = userSeed ?? `${Date.now()}-${Math.random()}`;
    const shuffled = seededShuffle(tarotData as TarotCard[], seed);

    const count = spread === "three-card" ? 3 : 1;
    const selected = shuffled.slice(0, count).map((c, i) => ({
      ...c,
      upright: (hashString(seed + i) % 2) === 0,
    }));

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "서버 설정이 완료되지 않았습니다." },
        { status: 503 }
      );
    }

    const cardsDesc = selected
      .map(
        (c, i) =>
          `${i + 1}. ${c.krName}(${c.name}) - ${c.upright ? "정방향" : "역방향"}`
      )
      .join("\n");

    const prompt = `타로 카드 해석을 JSON으로 작성해 주세요.

뽑힌 카드:
${cardsDesc}

질문(없으면 ""): ${question}

반드시 아래 JSON 구조만 반환:
{
  "spread":"one-card|three-card",
  "question":"사용자 질문 또는 추천 질문",
  "cards":[
    {"name":"카드영문명","krName":"한국어명","upright":true/false,"meaning":"핵심 의미","advice":"조언","keywords":["키워드1","키워드2"]}
  ],
  "overall":"전체 결론 (2~3문장)",
  "nextAction":["바로 할 행동 3개"]
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error("Empty response");

    const parsed = JSON.parse(content) as TarotResponse;
    incrementRate(clientId);
    return NextResponse.json(parsed);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "타로 해석에 실패했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 }
    );
  }
}

function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}
