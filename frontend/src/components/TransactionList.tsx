import type { TransactionWithCategory } from '../types';
import { formatMoney, formatDate, typeBgClass, typeLabel } from '../lib/format';
import { Edit, Trash2 } from 'lucide-react';

interface Props {
  transactions: TransactionWithCategory[];
  onEdit: (t: TransactionWithCategory) => void;
  onDelete: (t: TransactionWithCategory) => void;
}

export default function TransactionList({ transactions, onEdit, onDelete }: Props) {
  if (transactions.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-slate-400">当前周期内暂无账目记录</div>
    );
  }
  return (
    <ul className="divide-y divide-slate-100">
      {transactions.map((t) => (
        <li key={t.id} className="flex items-center gap-3 py-3">
          <div className={`shrink-0 inline-flex items-center text-xs px-2 py-1 rounded-md ring-1 ${typeBgClass(t.type)}`}>
            {typeLabel(t.type)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-slate-800 truncate">
              {t.category?.name ?? '未分类'}
              <span className="ml-2 text-slate-400 font-normal">{formatDate(t.date)}</span>
            </div>
            {t.note && <div className="text-xs text-slate-500 truncate mt-0.5">{t.note}</div>}
          </div>
          <div className={`shrink-0 text-sm font-semibold ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
            {t.type === 'income' ? '+' : '-'}{formatMoney(Number(t.amount)).replace('-', '')}
          </div>
          <div className="shrink-0 flex items-center gap-1">
            <button
              onClick={() => onEdit(t)}
              className="p-1.5 rounded hover:bg-slate-100 text-slate-500"
              aria-label="编辑"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(t)}
              className="p-1.5 rounded hover:bg-rose-50 text-rose-500"
              aria-label="删除"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
