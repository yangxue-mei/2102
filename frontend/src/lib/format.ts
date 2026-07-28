import type { TxType } from '../types';

export function formatMoney(n: number): string {
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  return `${sign}¥${abs.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(d: string | Date): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(date.getTime())) return String(d);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function typeLabel(t: TxType): string {
  return t === 'income' ? '收入' : '支出';
}

export function typeColorClass(t: TxType): string {
  return t === 'income' ? 'text-emerald-600' : 'text-rose-600';
}

export function typeBgClass(t: TxType): string {
  return t === 'income' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-rose-50 text-rose-700 ring-rose-200';
}

const CHART_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#e11d48', '#db2777',
  '#f43f5e', '#fb7185', '#fda4af', '#fecdd3', '#fbcfe8',
];

export function pickColor(i: number): string {
  return CHART_COLORS[i % CHART_COLORS.length];
}

export function todayISO(): string {
  return formatDate(new Date());
}
