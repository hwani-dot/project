/**
 * API 응답 JSON 타입 정의
 */

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

export interface TarotCardResponse {
  name: string;
  krName: string;
  upright: boolean;
  meaning: string;
  advice: string;
  keywords: string[];
}

export interface TarotResponse {
  spread: "one-card" | "three-card";
  question: string;
  cards: TarotCardResponse[];
  overall: string;
  nextAction: string[];
}

export interface OhahasaRankItem {
  rank: number;
  sign: { slug: string; krName: string };
  score: number;
  oneLiner: string;
  keywords: string[];
  lucky: { color: string; number: string; item: string; place: string };
  do: string[];
  dont: string[];
}

export interface OhahasaResponse {
  date: string;
  title: string;
  ranking: OhahasaRankItem[];
  notes: string;
}

export interface UserProfile {
  nickname: string;
  gender?: string;
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  birthHour?: number;
  birthMinute?: number;
  interests?: string[];
}
