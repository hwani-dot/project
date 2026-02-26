import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { hashString, seededPick } from "@/lib/seed";
import { isDemoMode, logDemoModeOnce } from "@/lib/demo";
import type { TodayFortuneResult } from "@/types/fortune";

const RATE_LIMIT = 10;
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

function parseProfile(body: Record<string, unknown>): {
  birth: string;
  name: string;
  interests: string[];
  relation?: string;
  calendarType?: string;
  birthTime?: string;
} {
  const birth =
    (body.birth as string)?.match(/^\d{4}-\d{2}-\d{2}$/)?.[0] ??
    (body.birthYear != null && body.birthMonth != null && body.birthDay != null
      ? `${String(body.birthYear).padStart(4, "0")}-${String(Number(body.birthMonth)).padStart(
          2,
          "0"
        )}-${String(Number(body.birthDay)).padStart(2, "0")}`
      : "");

  const name = (body.name as string)?.trim() || (body.nickname as string)?.trim() || "방문자";

  const interests = Array.isArray(body.interests)
    ? (body.interests as string[]).filter(Boolean)
    : [];

  return {
    birth,
    name,
    interests,
    relation: body.relation as string | undefined,
    calendarType: body.calendarType as string | undefined,
    birthTime: body.birthTime as string | undefined,
  };
}

function defaultBirth(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 25);
  return d.toISOString().slice(0, 10);
}

function buildFallback(profile: ReturnType<typeof parseProfile>): TodayFortuneResult {
  const date = new Date().toISOString().slice(0, 10);
  const seed = `${date}-${profile.birth}-${profile.name}`;

  const headlines = [
    "운세의 총운은 금상첨화 입니다",
    "오늘의 총운은 무난하고 안정적입니다",
    "총운이 좋은 날, 작은 기쁨이 찾아올 수 있습니다",
    "오늘 총운은 전반적으로 양호합니다",
    "총운이 순조로운 하루를 예고합니다",
  ];
  const headline = seededPick(headlines, seed + "headline");

  const overviewParagraphs = [
    "오늘은 전반적으로 안정적인 흐름이 예상되는 날입니다. 아침부터 차분한 마음으로 하루를 시작하면 좋겠습니다. 작은 기회가 눈에 띌 수 있으니 주변을 살펴보세요. 무리하지 않는 것이 좋은 하루를 만드는 비결입니다. 오후에는 가까운 사람과의 대화가 기분을 밝혀 줄 수 있습니다.",
    "오늘의 에너지는 무난하게 흐를 것으로 보입니다. 중요한 결정은 내일로 미루는 편이 좋을 수 있습니다. 오전에 할 일을 정리해 두면 하루가 순조롭게 흘러갑니다. 저녁에는 휴식을 취하며 내일을 위한 준비를 해 보세요.",
    "오늘은 소소한 기쁨이 있는 날입니다. 급하게 서두르기보다 여유를 갖는 것이 좋겠습니다. 낯선 사람과의 인연이 생길 수도 있으니 열린 마음으로 대하세요. 저녁 무렵에는 가벼운 산책을 권합니다.",
  ];
  const overview = seededPick(overviewParagraphs, seed + "overview");

  const summaries = [
    "오늘은 전반적으로 안정적인 흐름이 예상됩니다.",
    "작은 기회가 눈에 띌 수 있으니 주변을 살펴보세요.",
    "무리하지 않는 것이 좋은 하루를 만드는 비결입니다.",
  ];
  const s0 = seededPick(summaries, seed + "0");
  const s1 = seededPick(summaries, seed + "1");
  const s2 = seededPick(summaries, seed + "2");

  const loveTexts = [
    "오늘은 상대방과의 소통이 원활할 수 있습니다. 솔직한 대화를 시도해 보세요.",
    "연애운이 무난한 날입니다. 작은 배려가 관계를 돈독하게 합니다.",
    "오늘은 혼자만의 시간도 필요할 수 있습니다. 무리하지 마세요.",
  ];
  const moneyTexts = [
    "금전운은 보통입니다. 불필요한 지출은 삼가고 계획적인 소비를 권합니다.",
    "작은 수입의 기회가 있을 수 있습니다. 기회를 놓치지 마세요.",
    "오늘은 저축이나 정리를 하기 좋은 날입니다.",
  ];
  const studyTexts = [
    "집중력이 올라가는 날입니다. 중요한 공부를 오전에 해보세요.",
    "학업운이 무난합니다. 꾸준함이 빛을 발할 수 있습니다.",
    "오늘은 복습이나 정리에 적합한 날입니다.",
  ];
  const healthTexts = [
    "건강운이 양호합니다. 적당한 휴식과 수분 섭취를 유지하세요.",
    "오늘은 과로를 피하는 것이 좋습니다. 충분한 휴식을 취하세요.",
    "몸이 무거울 수 있으니 가벼운 스트레칭을 권합니다.",
  ];
  const relationsTexts = [
    "대인관계가 원활한 날입니다. 새로운 인연이 생길 수도 있습니다.",
    "주변 사람들과의 소통이 중요합니다. 먼저 연락해 보세요.",
    "오늘은 조용히 지내는 것도 좋은 선택입니다.",
  ];

  const keywordsPool = ["안정", "소통", "기회", "휴식", "성장", "균형", "배려", "인내"];
  const k1 = seededPick(keywordsPool, seed + "k1");
  const k2 = seededPick(keywordsPool.filter((x) => x !== k1), seed + "k2");
  const k3 = seededPick(keywordsPool.filter((x) => x !== k1 && x !== k2), seed + "k3");

  const cautions = ["성급한 결정은 피하세요.", "과한 약속은 삼가세요.", "감정적인 반응은 나중에 후회할 수 있습니다."];
  const actions = ["오늘 한 가지 좋은 일을 기록해 보세요.", "가까운 사람에게 연락해 보세요.", "30분 정도 산책을 권합니다."];
  const colors = ["파랑", "초록", "흰색", "베이지", "연보라"];
  const times = ["09:00~11:00", "14:00~16:00", "18:00~20:00"];
  const items = ["펜", "책", "물병", "손수건", "열쇠고리"];

  const num = (hashString(seed + "num") % 9) + 1;

  return {
    date,
    title: "오늘의 흐름",
    headline,
    overview,
    summary: [s0, s1, s2],
    sections: {
      love: seededPick(loveTexts, seed + "love"),
      money: seededPick(moneyTexts, seed + "money"),
      study: seededPick(studyTexts, seed + "study"),
      health: seededPick(healthTexts, seed + "health"),
      relations: seededPick(relationsTexts, seed + "relations"),
    },
    keywords: [k1, k2, k3],
    caution: seededPick(cautions, seed + "caution"),
    recommendedAction: seededPick(actions, seed + "action"),
    lucky: {
      color: seededPick(colors, seed + "color"),
      number: num,
      item: seededPick(items, seed + "item"),
      time: seededPick(times, seed + "time"),
    },
  };
}

export async function POST(req: NextRequest) {
  const clientId = getClientId(req);
  if (!checkRateLimit(clientId)) {
    return NextResponse.json({ error: "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요." }, { status: 429 });
  }

  try {
    const body = (await req.json()) as Record<string, unknown>;
    const profile = parseProfile(body);

    if (!profile.birth || !/^\d{4}-\d{2}-\d{2}$/.test(profile.birth)) {
      return NextResponse.json({ error: "생년월일(birth)이 필요합니다." }, { status: 400 });
    }

    // ✅ 1) 키 없으면 즉시 fallback (OpenAI 코드로 절대 내려가지 않기)
    if (!hasOpenAIKey()) {
      logDemoModeOnce();
      const fallback = buildFallback(profile);
      incrementRate(clientId);
      return NextResponse.json({ ...fallback, meta: { demo: true, reason: "no_openai_key" } });
    }

    const date = new Date().toISOString().slice(0, 10);
    const seed = `${date}-${profile.birth}-${profile.name}`;

    if (!isDemoMode()) {
      try {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        const birthLine = profile.birthTime ? `${profile.birth} ${profile.birthTime}` : profile.birth;

        const prompt = `당신은 운세 전문가입니다. 아래 정보를 바탕으로 오늘(${date})의 개인화된 운세를 JSON으로 작성해 주세요.

사용자: ${profile.name}
생년월일: ${birthLine}
관심사: ${profile.interests.join(", ") || "전반"}
달력: ${profile.calendarType === "lunar" ? "음력" : "양력"}

규칙:
- 한국어, 과한 오글거림 X, 섹션당 2~4문장
- 의료/법률/투자 확정적 조언 금지("반드시/무조건" 등 사용 금지)
- seed: ${seed} (같은 seed면 비슷한 톤 유지)

반드시 아래 JSON만 반환 (다른 텍스트 없이):
{
  "date": "${date}",
  "title": "오늘의 흐름",
  "headline": "운세의 총운은 ○○ 입니다 (예: 금상첨화/무난함/양호 등 1줄)",
  "overview": "총운 본문. 자연스러운 문단 스타일로 5~10문장",
  "summary": ["1줄 요약", "2줄 요약", "3줄 요약"],
  "sections": {
    "love": "연애운 2~4문장",
    "money": "금전운 2~4문장",
    "study": "학업운 2~4문장",
    "health": "건강운 2~4문장",
    "relations": "대인관계 2~4문장"
  },
  "keywords": ["키워드1", "키워드2", "키워드3"],
  "caution": "피해야 할 것 1개",
  "recommendedAction": "오늘의 추천 행동 1개",
  "lucky": {
    "color": "행운의 색",
    "number": 7,
    "item": "행운의 아이템",
    "time": "14:00~16:00"
  }
}`;

        // ✅ 2) OpenAI 호출 타임아웃 (9초)
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
          const parsed = JSON.parse(content) as TodayFortuneResult;
          if (
            parsed.date &&
            parsed.title &&
            parsed.summary &&
            Array.isArray(parsed.summary) &&
            parsed.sections &&
            typeof parsed.sections === "object"
          ) {
            parsed.date = date;
            parsed.headline = String(parsed.headline ?? "오늘의 총운을 확인해 보세요.");
            parsed.overview = String(
              parsed.overview ?? parsed.summary?.join(" ") ?? "오늘의 운세를 확인해 보세요."
            );
            parsed.lucky = {
              color: String(parsed.lucky?.color ?? "파랑"),
              number: Number(parsed.lucky?.number) || 7,
              item: String(parsed.lucky?.item ?? "펜"),
              time: String(parsed.lucky?.time ?? "14:00~16:00"),
            };
            parsed.keywords = Array.isArray(parsed.keywords)
              ? parsed.keywords.slice(0, 3).map(String)
              : ["안정", "소통", "기회"];
            parsed.caution = String(parsed.caution ?? "성급한 결정은 피하세요.");
            parsed.recommendedAction = String(parsed.recommendedAction ?? "오늘 한 가지 좋은 일을 기록해 보세요.");
            incrementRate(clientId);
            return NextResponse.json(parsed);
          }
        }
      } catch (e) {
        console.error("today openai error:", e);
      }
    }

    // ✅ demo / fallback
    logDemoModeOnce();
    const fallback = buildFallback(profile);
    incrementRate(clientId);
    return NextResponse.json({ ...fallback, meta: { demo: true } });
  } catch (e) {
    console.error("today route error:", e);
    logDemoModeOnce();
    const fallbackProfile = { birth: "2000-01-01", name: "방문자", interests: [] as string[] };
    const fallback = buildFallback(fallbackProfile);
    incrementRate(clientId);
    return NextResponse.json({ ...fallback, meta: { demo: true } });
  }
}