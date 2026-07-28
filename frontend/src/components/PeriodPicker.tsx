import type { PeriodFilter } from '../types';

interface Props {
  value: PeriodFilter;
  onChange: (v: PeriodFilter) => void;
}

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const YEARS = (() => {
  const now = new Date();
  const arr: number[] = [];
  for (let y = now.getFullYear() - 5; y <= now.getFullYear() + 1; y++) arr.push(y);
  return arr;
})();

export default function PeriodPicker({ value, onChange }: Props) {
  const now = new Date();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-sm">
        <button
          className={`px-3 py-1.5 rounded-md ${
            value.view === 'month' ? 'bg-slate-900 text-white' : 'text-slate-600'
          }`}
          onClick={() => onChange({ ...value, view: 'month' })}
        >
          月度
        </button>
        <button
          className={`px-3 py-1.5 rounded-md ${
            value.view === 'year' ? 'bg-slate-900 text-white' : 'text-slate-600'
          }`}
          onClick={() => onChange({ ...value, view: 'year' })}
        >
          年度
        </button>
      </div>
      <div className="flex items-center gap-1">
        <select
          className="border border-slate-200 bg-white rounded-md px-2 py-1.5 text-sm"
          value={value.year}
          onChange={(e) => onChange({ ...value, year: Number(e.target.value) })}
          aria-label="年份"
        >
          {YEARS.map((y) => (
            <option key={y} value={y}>{y} 年</option>
          ))}
        </select>
        {value.view === 'month' && (
          <select
            className="border border-slate-200 bg-white rounded-md px-2 py-1.5 text-sm"
            value={value.month}
            onChange={(e) => onChange({ ...value, month: Number(e.target.value) })}
            aria-label="月份"
          >
            {MONTHS.map((m) => (
              <option key={m} value={m}>{m} 月</option>
            ))}
          </select>
        )}
      </div>
      <button
        className="px-3 py-1.5 rounded-md text-sm text-slate-600 border border-slate-200 bg-white hover:bg-slate-50"
        onClick={() =>
          onChange({
            view: 'month',
            year: now.getFullYear(),
            month: now.getMonth() + 1,
          })
        }
      >
        本月
      </button>
    </div>
  );
}

export function periodRange(p: PeriodFilter): { startDate: string; endDate: string } {
  if (p.view === 'year') {
    return { startDate: `${p.year}-01-01`, endDate: `${p.year}-12-31` };
  }
  const start = `${p.year}-${String(p.month).padStart(2, '0')}-01`;
  const endDay = new Date(p.year, p.month, 0).getDate();
  const end = `${p.year}-${String(p.month).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;
  return { startDate: start, endDate: end };
}

export function periodLabel(p: PeriodFilter): string {
  return p.view === 'year' ? `${p.year} 年度` : `${p.year} 年 ${p.month} 月`;
}
