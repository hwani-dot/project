import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import { ZODIAC_SIGNS } from "@/data/zodiac";
import { seededShuffle } from "@/lib/seed";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import type { OhahasaResponse, OhahasaRankItem } from "@/types/fortune";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
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
    const dateStr = body.date ?? format(new Date(), "yyyy-MM-dd");

    const cached = await prisma.dailyOhahasa.findUnique({
      where: { date: dateStr },
    });

    if (cached) {
      const payload = JSON.parse(cached.payload) as OhahasaResponse;
      incrementRate(clientId);
      return NextResponse.json(payload);
    }

    const seed = `${dateStr}-${SECRET_SALT}`;
    const shuffled = seededShuffle([...ZODIAC_SIGNS], seed);

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "서버 설정이 완료되지 않았습니다." },
        { status: 503 }
      );
    }

    const signsList = shuffled
      .map((s, i) => `${i + 1}위: ${s.krName}자리`)
      .join(", ");

    const prompt = `오하아사(별자리 운세 순위)입니다. ${dateStr} 기준 12별자리 순위가 아래와 같습니다.

순위: ${signsList}

각 별자리별로 오늘의 한 줄 운세, 키워드 3개, 행운 요소, 추천/주의 행동을 JSON으로 작성해 주세요.

반드시 아래 JSON 구조만 반환 (배열 순서는 위 순위 그대로):
{
  "date": "${dateStr}",
  "title": "${format(new Date(dateStr), "yyyy년 M월 d일", { locale: ko })} 오하아사",
  "ranking": [
    {
      "rank": 1,
      "sign": {"slug":"영문슬러그","krName":"한국어명"},
      "score": 70,
      "oneLiner": "한 줄 운세",
      "keywords": ["키워드1","키워드2","키워드3"],
      "lucky": {"color":"","number":"","item":"","place":""},
      "do": ["추천2개"],
      "dont": ["주의2개"]
    }
  ],
  "notes": "오늘 전체 분위기 한 문단"
}

slug는 aquarius, pisces, aries, taurus, gemini, cancer, leo, virgo, libra, scorpio, sagittarius, capricorn 중 하나. 순위의 별자리와 정확히 매칭되게.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error("Empty response");

    let parsed = JSON.parse(content) as OhahasaResponse;

    if (!parsed.ranking || parsed.ranking.length !== 12) {
      parsed = buildFallback(dateStr, shuffled);
    } else {
      parsed.ranking = parsed.ranking.map((r, i) => ({
        ...r,
        rank: i + 1,
        sign: r.sign ?? { slug: shuffled[i]!.slug, krName: shuffled[i]!.krName },
      })) as OhahasaRankItem[];
    }

    await prisma.dailyOhahasa.upsert({
      where: { date: dateStr },
      create: { date: dateStr, payload: JSON.stringify(parsed) },
      update: { payload: JSON.stringify(parsed) },
    });

    incrementRate(clientId);
    return NextResponse.json(parsed);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "오하아사 생성에 실패했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 }
    );
  }
}

function buildFallback(
  dateStr: string,
  shuffled: (typeof ZODIAC_SIGNS)[number][]
): OhahasaResponse {
  return {
    date: dateStr,
    title: `${format(new Date(dateStr), "yyyy년 M월 d일", { locale: ko })} 오하아사`,
    ranking: shuffled.map((s, i) => ({
      rank: i + 1,
      sign: { slug: s.slug, krName: s.krName },
      score: 70 - i * 5,
      oneLiner: `${s.krName}자리 오늘은 ${i < 3 ? "좋은" : "보통"} 에너지가 흐릅니다.`,
      keywords: ["에너지", "성장", "균형"],
      lucky: { color: "골드", number: String(i + 1), item: "불명", place: "미정" },
      do: ["긍정적인 마음 유지", "소통하기"],
      dont: ["성급한 결정", "감정적인 반응"],
    })),
    notes: "오늘의 에너지를 긍정적으로 활용해 보세요.",
  };
}
