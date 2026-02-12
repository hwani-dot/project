/**
 * 12별자리 정의 - 한국어, 슬러그, 날짜 범위
 * 오하아사 및 생일→별자리 매핑에 사용
 */

export type ZodiacSlug =
  | "aquarius"
  | "pisces"
  | "aries"
  | "taurus"
  | "gemini"
  | "cancer"
  | "leo"
  | "virgo"
  | "libra"
  | "scorpio"
  | "sagittarius"
  | "capricorn";

export interface ZodiacSign {
  slug: ZodiacSlug;
  krName: string;
  /** 날짜 범위: [월, 일] - 시작일 (월의 1일부터 시작) */
  startMonth: number;
  startDay: number;
  /** 날짜 범위: [월, 일] - 종료일 (월의 마지막일까지) */
  endMonth: number;
  endDay: number;
}

export const ZODIAC_SIGNS: ZodiacSign[] = [
  { slug: "capricorn", krName: "염소", startMonth: 12, startDay: 22, endMonth: 1, endDay: 19 },
  { slug: "aquarius", krName: "물병", startMonth: 1, startDay: 20, endMonth: 2, endDay: 18 },
  { slug: "pisces", krName: "물고기", startMonth: 2, startDay: 19, endMonth: 3, endDay: 20 },
  { slug: "aries", krName: "양", startMonth: 3, startDay: 21, endMonth: 4, endDay: 19 },
  { slug: "taurus", krName: "황소", startMonth: 4, startDay: 20, endMonth: 5, endDay: 20 },
  { slug: "gemini", krName: "쌍둥이", startMonth: 5, startDay: 21, endMonth: 6, endDay: 20 },
  { slug: "cancer", krName: "게", startMonth: 6, startDay: 21, endMonth: 7, endDay: 22 },
  { slug: "leo", krName: "사자", startMonth: 7, startDay: 23, endMonth: 8, endDay: 22 },
  { slug: "virgo", krName: "처녀", startMonth: 8, startDay: 23, endMonth: 9, endDay: 22 },
  { slug: "libra", krName: "천칭", startMonth: 9, startDay: 23, endMonth: 10, endDay: 22 },
  { slug: "scorpio", krName: "전갈", startMonth: 10, startDay: 23, endMonth: 11, endDay: 21 },
  { slug: "sagittarius", krName: "사수", startMonth: 11, startDay: 22, endMonth: 12, endDay: 21 },
];

export function getZodiacBySlug(slug: ZodiacSlug): ZodiacSign | undefined {
  return ZODIAC_SIGNS.find((z) => z.slug === slug);
}
