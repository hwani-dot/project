/**
 * 생일 → 별자리 매핑 유틸
 */

import { ZODIAC_SIGNS, type ZodiacSign, type ZodiacSlug } from "@/data/zodiac";

/**
 * 생년월일로 별자리 계산
 */
export function getZodiacFromBirthday(year: number, month: number, day: number): ZodiacSign | null {
  for (const sign of ZODIAC_SIGNS) {
    if (isDateInRange(month, day, sign.startMonth, sign.startDay, sign.endMonth, sign.endDay)) {
      return sign;
    }
  }
  return null;
}

function isDateInRange(
  m: number,
  d: number,
  startM: number,
  startD: number,
  endM: number,
  endD: number
): boolean {
  const date = m * 100 + d;
  const start = startM * 100 + startD;
  const end = endM * 100 + endD;

  // 염소자리처럼 12월~1월에 걸친 경우
  if (start > end) {
    return date >= start || date <= end;
  }
  return date >= start && date <= end;
}

export function getZodiacSlugFromBirthday(
  year: number,
  month: number,
  day: number
): ZodiacSlug | null {
  const sign = getZodiacFromBirthday(year, month, day);
  return sign?.slug ?? null;
}
