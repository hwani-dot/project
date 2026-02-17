/**
 * 프로필 localStorage 키 (클라이언트 전용)
 */

export const FORTUNE_PROFILE_KEY = "fortune_profile";

const LEGACY_PROFILE_KEY = "fortune-profile";

export function getStoredProfile(): unknown {
  if (typeof window === "undefined") return null;
  try {
    let raw = localStorage.getItem(FORTUNE_PROFILE_KEY);
    if (!raw) {
      const legacy = localStorage.getItem(LEGACY_PROFILE_KEY);
      if (legacy) {
        localStorage.setItem(FORTUNE_PROFILE_KEY, legacy);
        localStorage.removeItem(LEGACY_PROFILE_KEY);
        raw = legacy;
      }
    }
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function hasStoredProfile(): boolean {
  const p = getStoredProfile();
  if (p === null || typeof p !== "object") return false;
  if ("birth" in p && typeof (p as { birth?: string }).birth === "string") return true;
  return "birthYear" in p && "birthMonth" in p && "birthDay" in p;
}

/** 프로필에서 birth(YYYY-MM-DD) 또는 birthYear/Month/Day → { year, month, day } 반환 */
export function getBirthParts(profile: Record<string, unknown> | null): { year: number; month: number; day: number } {
  const def = { year: 2000, month: 1, day: 1 };
  if (!profile) return def;
  const birth = profile.birth as string | undefined;
  if (birth && /^\d{4}-\d{2}-\d{2}$/.test(birth)) {
    const [y, m, d] = birth.split("-").map(Number);
    return { year: y, month: m, day: d };
  }
  const y = profile.birthYear as number | undefined;
  const m = profile.birthMonth as number | undefined;
  const d = profile.birthDay as number | undefined;
  if (y != null && m != null && d != null) return { year: y, month: m, day: d };
  return def;
}
