import type { TransactionWithCategory } from '../types';
import { formatMoney } from '../lib/format';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';

export default function SummaryCards({ transactions }: { transactions: TransactionWithCategory[] }) {
  let income = 0;
  let expense = 0;
  for (const t of transactions) {
    if (t.type === 'income') income += Number(t.amount);
    else expense += Number(t.amount);
  }
  const balance = income - expense;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
        <div className="flex items-center justify-between text-emerald-700">
          <span className="text-sm">收入</span>
          <TrendingUp className="w-4 h-4" />
        </div>
        <div className="mt-1 text-2xl font-semibold text-emerald-700">{formatMoney(income)}</div>
      </div>
      <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4">
        <div className="flex items-center justify-between text-rose-700">
          <span className="text-sm">支出</span>
          <TrendingDown className="w-4 h-4" />
        </div>
        <div className="mt-1 text-2xl font-semibold text-rose-700">{formatMoney(expense)}</div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between text-slate-600">
          <span className="text-sm">结余</span>
          <Wallet className="w-4 h-4" />
        </div>
        <div className={`mt-1 text-2xl font-semibold ${balance >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
          {formatMoney(balance)}
        </div>
      </div>
    </div>
  );
}
