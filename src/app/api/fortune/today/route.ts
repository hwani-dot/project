import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import type { TodayFortuneResponse } from "@/types/fortune";

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
    const { nickname, birth, birthTime, birthYear, birthMonth, birthDay, interests } = body;
    let y: number, m: number, d: number;
    if (birth && /^\d{4}-\d{2}-\d{2}$/.test(birth)) {
      [y, m, d] = birth.split("-").map(Number);
    } else if (birthYear != null && birthMonth != null && birthDay != null) {
      y = Number(birthYear);
      m = Number(birthMonth);
      d = Number(birthDay);
    } else {
      return NextResponse.json({ error: "생년월일이 필요합니다." }, { status: 400 });
    }
    const seed = `${new Date().toISOString().slice(0, 10)}-${nickname}-${y}-${m}-${d}`;

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "서버 설정이 완료되지 않았습니다." },
        { status: 503 }
      );
    }

    const birthLine = birthTime ? `${y}년 ${m}월 ${d}일 ${birthTime}` : `${y}년 ${m}월 ${d}일`;
    const prompt = `당신은 운세 전문가입니다. 아래 정보를 바탕으로 오늘의 개인화된 운세를 JSON 형식으로 작성해 주세요.

사용자: ${nickname}
생년월일: ${birthLine}
관심사: ${(interests ?? []).join(", ") || "전반"}

반드시 아래 JSON 구조만 반환하고, 다른 설명은 붙이지 마세요:
{
  "title": "오늘의 운세 요약 제목 (한 줄)",
  "summary": "3줄 요약 (줄바꿈 없이)",
  "sections": [
    {"key":"overall","label":"총운","score":0-100,"text":"설명"},
    {"key":"love","label":"연애","score":0-100,"text":"설명"},
    {"key":"money","label":"금전","score":0-100,"text":"설명"},
    {"key":"work","label":"학업/일","score":0-100,"text":"설명"},
    {"key":"health","label":"건강","score":0-100,"text":"설명"}
  ],
  "lucky": {"color":"행운의 색","number":"행운의 숫자","item":"행운의 아이템","place":"행운의 장소"},
  "do": ["추천 행동 3개"],
  "dont": ["주의 행동 3개"],
  "oneLiner": "오늘의 한 줄"
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error("Empty response");

    const parsed = JSON.parse(content) as TodayFortuneResponse;
    incrementRate(clientId);
    return NextResponse.json(parsed);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "운세 생성에 실패했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 }
    );
  }
}
