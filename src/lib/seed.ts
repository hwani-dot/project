/**
 * 決定論的 셔플 (deterministic shuffle)
 * seed 기반 - 같은 seed면 같은 결과
 */

export function seededShuffle<T>(arr: T[], seed: string): T[] {
  const result = [...arr];
  let hash = hashString(seed);

  for (let i = result.length - 1; i > 0; i--) {
    hash = (hash * 31 + 17) >>> 0;
    const j = hash % (i + 1);
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}
