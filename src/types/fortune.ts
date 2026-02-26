/**
 * API 응답 JSON 타입 정의
 */

/** 오늘의 운세 결과 (프로덕션 스펙) */
export interface TodayFortuneResult {
  date: string;
  title: string;
  /** 총운 헤드라인 (예: "운세의 총운은 금상첨화 입니다"). 없으면 overview 첫 문장 사용 */
  headline?: string;
  /** 총운 본문 (네이버 운세 스타일 문단) */
  overview: string;
  summary: string[];
  sections: {
    love: string;
    money: string;
    study: string;
    health: string;
    relations: string;
  };
  keywords: string[];
  caution: string;
  recommendedAction: string;
  lucky: {
    color: string;
    number: number;
    item: string;
    time: string;
  };
}

/** 공유용 오늘의 운세 payload */
export interface TodayFortuneSharePayload {
  kind: "today";
  date: string;
  profileSnapshot: { name?: string; birth?: string; interests?: string[] };
  result: TodayFortuneResult;
}

/** @deprecated 이전 TodayFortuneResponse (하위 호환용) */
export interface TodayFortuneResponse {
  title: string;
  summary: string;
  sections: {
    key: string;
    label: string;
    score: number;
    text: string;
  }[];
  lucky: { color: string; number: string; item: string; place: string };
  do: string[];
  dont: string[];
  oneLiner: string;
}

/** 타로 스프레드 타입 */
export type TarotSpread = "single" | "three_past_present_future";

/** 타로 카드 결과 (API 응답) - tarot.json의 카드 id 또는 name 기반 id */
export interface TarotCardResult {
  id: string;
  name: string;
  isReversed: boolean;
  position?: "past" | "present" | "future";
  keywords: string[];
  interpretation: string;
}

/** 타로 결과 (프로덕션 스펙) - API는 이 스펙으로 반드시 응답 */
export interface TarotResult {
  date: string;
  spread: TarotSpread;
  question?: string;
  headline: string;
  summary: string;
  advice: string;
  caution?: string;
  cards: TarotCardResult[];
}

/** 공유용 타로 payload */
export interface TarotSharePayload {
  kind: "tarot";
  date: string;
  profileSnapshot?: { name?: string; birth?: string; interests?: string[] };
  result: TarotResult;
}

/** @deprecated 이전 TarotResponse (하위 호환용) */
export interface TarotCardResponse {
  name: string;
  krName: string;
  upright: boolean;
  meaning: string;
  advice: string;
  keywords: string[];
}

/** @deprecated 이전 TarotResponse (하위 호환용) */
export interface TarotResponse {
  spread: "one-card" | "three-card";
  question: string;
  cards: TarotCardResponse[];
  overall: string;
  nextAction: string[];
}

/** @deprecated 이전 OhahasaRankItem (하위 호환용) */
export interface OhahasaRankItem {
  rank: number;
  sign: { slug: string; krName: string };
  score: number;
  oneLiner: string;
  keywords: string[];
  lucky: { color: string; number: string; item: string; place: string };
  do?: string[];
  dont?: string[];
}

/** @deprecated 이전 OhahasaResponse (하위 호환용) */
export interface OhahasaResponse {
  date: string;
  title: string;
  ranking: OhahasaRankItem[];
  notes: string;
}

/** 오하아사 분야별 운세 (점수 0~100 + 코멘트) */
export interface OhahasaBreakdown {
  love: { score: number; comment: string };
  money: { score: number; comment: string };
  studyOrCareer: { score: number; comment: string };
  health: { score: number; comment: string };
  relations: { score: number; comment: string };
}

/** 오하아사 행운 요소 */
export interface OhahasaLucky {
  color: string;
  number: string;
  item: string;
  /** @deprecated luckyTime으로 마이그레이션 */
  time?: string;
  /** 좋은 시간대 */
  luckyTime?: string;
  /** 주의 시간대 (어제 데이터 없으면 null) */
  cautionTime?: string | null;
}

/** 오하아사 개별 별자리 아이템 (프로덕션 스펙) */
export interface OhahasaItem {
  sign: { slug: string; krName: string };
  rank: number;
  score: number;
  oneLine: string;
  keywords: string[];
  lucky: OhahasaLucky;
  breakdown: OhahasaBreakdown;
  /** 어제 대비 순위 변화 (양수=상승, 음수=하락, null=어제 데이터 없음) */
  deltaRank: number | null;
  /** 어제 대비 점수 변화 (양수=상승, 음수=하락, null=어제 데이터 없음) */
  deltaScore?: number | null;
  /** 오늘의 한 문장 시그니처 (총운 위 강조용) */
  headline?: string;
  /** 총운 본문 (5~8줄) */
  overview?: string;
  /** @deprecated 하위 호환 - oneLine과 동일 */
  oneLiner?: string;
  do?: string[];
  dont?: string[];
}

/** 오하아사 결과 (프로덕션 스펙) */
export interface OhahasaResult {
  date: string;
  title: string;
  items: OhahasaItem[];
  notes: string;
  /** 하위 호환: items를 ranking 형태로 매핑 */
  ranking?: OhahasaRankItem[];
}

/** 공유용 오하아사 payload */
export interface OhahasaSharePayload {
  kind: "ohahasa";
  date: string;
  result: OhahasaResult;
}

export interface UserProfile {
  /** 이름 (저장 키는 name 또는 nickname 호환) */
  nickname: string;
  name?: string;
  /** 본인/가족/친구/연인/기타 */
  relation?: string;
  gender?: string;
  /** YYYY-MM-DD */
  birth?: string;
  /** HH:mm. 시간 모를 때는 비우고 timeUnknown: true */
  birthTime?: string;
  /** 태어난 시간 모름 여부 */
  timeUnknown?: boolean;
  /** 양력/음력 */
  calendarType?: "solar" | "lunar";
  birthYear?: number;
  birthMonth?: number;
  birthDay?: number;
  birthHour?: number;
  birthMinute?: number;
  interests?: string[];
}
