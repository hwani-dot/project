/**
 * 별자리(sign) → Lucide 아이콘 매핑
 * 황도 12궁과 1:1 매핑
 */

import type { LucideIcon } from "lucide-react";
import {
  Flame,
  Leaf,
  Users,
  Droplets,
  Fish,
  Scale,
  Waves,
  Mountain,
  Bug,
  Flower2,
  Sun,
  Target,
} from "lucide-react";
import type { ZodiacSlug } from "@/data/zodiac";

/** slug → Lucide 아이콘 컴포넌트 */
export const ZODIAC_ICONS: Record<ZodiacSlug, LucideIcon> = {
  aries: Flame,       // 양 - 불
  taurus: Leaf,       // 황소 - 흙
  gemini: Users,      // 쌍둥이 - 공기
  cancer: Droplets,   // 게 - 물
  leo: Sun,           // 사자 - 불
  virgo: Flower2,     // 처녀 - 흙
  libra: Scale,       // 천칭 - 공기
  scorpio: Bug,       // 전갈 - 물
  sagittarius: Target,// 사수 - 불
  capricorn: Mountain,// 염소 - 흙
  aquarius: Waves,    // 물병 - 공기
  pisces: Fish,       // 물고기 - 물
};

export function getZodiacIcon(slug: string): LucideIcon {
  return ZODIAC_ICONS[slug as ZodiacSlug] ?? Users;
}
