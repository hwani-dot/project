/**
 * 로컬 히스토리 저장 (localStorage)
 * 최근 30개 저장
 */

export const HISTORY_KEY = "fortune-history";
const MAX_ITEMS = 30;

export interface HistoryItem {
  id: string;
  type: "today" | "tarot" | "ohahasa";
  title: string;
  summary?: string;
  createdAt: string;
  payload: unknown;
}

export function getHistory(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HistoryItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addToHistory(item: Omit<HistoryItem, "id" | "createdAt">): void {
  const list = getHistory();
  const newItem: HistoryItem = {
    ...item,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  const updated = [newItem, ...list].slice(0, MAX_ITEMS);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
}

export function removeFromHistory(id: string): void {
  const list = getHistory().filter((h) => h.id !== id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
}
