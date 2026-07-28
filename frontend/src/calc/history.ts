// 历史记录模块：跨计算/方程模块的统一历史，持久化到 localStorage

export interface HistoryItem {
  id: string;
  expression: string;
  result: string;
  module: "calc" | "equation" | "base";
  at: number;
}

const KEY = "calc_history_v1";
const MAX = 200;

export function loadHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr as HistoryItem[];
  } catch {
    return [];
  }
}

export function saveHistory(items: HistoryItem[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(items.slice(0, MAX)));
  } catch {
    // 容量受限时静默
  }
}

export function addHistory(item: Omit<HistoryItem, "id" | "at">): HistoryItem[] {
  const items = loadHistory();
  const entry: HistoryItem = {
    id: `h_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    at: Date.now(),
    ...item,
  };
  items.unshift(entry);
  if (items.length > MAX) items.length = MAX;
  saveHistory(items);
  return items;
}

export function clearHistory(): void {
  saveHistory([]);
}
