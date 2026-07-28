import { useEffect, useState } from 'react';
import type { Category, Transaction, TxType } from '../types';
import { todayISO } from '../lib/format';
import { X } from 'lucide-react';

export interface FormValue {
  amount: string;
  date: string;
  type: TxType;
  category_id: string;
  note: string;
}

export interface FormErrors {
  amount?: string;
  date?: string;
  category_id?: string;
}

interface Props {
  open: boolean;
  initial?: Transaction | null;
  categories: Category[];
  onSubmit: (v: FormValue) => Promise<void>;
  onCancel: () => void;
}

export default function TransactionForm({ open, initial, categories, onSubmit, onCancel }: Props) {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayISO());
  const [type, setType] = useState<TxType>('expense');
  const [categoryId, setCategoryId] = useState('');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setAmount(String(initial.amount));
      setDate(initial.date);
      setType(initial.type);
      setCategoryId(initial.category_id ?? '');
      setNote(initial.note ?? '');
    } else {
      setAmount('');
      setDate(todayISO());
      setType('expense');
      setCategoryId('');
      setNote('');
    }
    setErrors({});
  }, [open, initial]);

  // 切换类型时清空分类选择
  useEffect(() => {
    setCategoryId('');
  }, [type]);

  if (!open) return null;

  const filteredCats = categories.filter((c) => c.type === type);

  const validate = (): boolean => {
    const errs: FormErrors = {};
    const n = Number(amount);
    if (!amount || Number.isNaN(n) || n <= 0) {
      errs.amount = '请输入大于 0 的金额';
    }
    if (!date) errs.date = '请选择日期';
    if (!categoryId) errs.category_id = '请选择分类';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onSubmit({ amount, date, type, category_id: categoryId, note });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div
        className="relative bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[92vh] overflow-auto"
        role="dialog"
        aria-modal="true"
        aria-describedby="tx-form-desc"
      >
        <div className="px-5 pt-5 pb-2 flex items-center justify-between">
          <h3 className="text-base font-semibold">{initial ? '编辑账目' : '新增账目'}</h3>
          <button onClick={onCancel} className="p-1.5 rounded hover:bg-slate-100" aria-label="关闭">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p id="tx-form-desc" className="sr-only">
          填写金额、日期、收支类型、分类与备注，提交后将保存到当前用户账目列表。
        </p>
        <form onSubmit={handleSubmit} className="px-5 pb-5 flex flex-col gap-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">收支类型</label>
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 w-full">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`flex-1 px-3 py-1.5 rounded-md text-sm ${
                  type === 'expense' ? 'bg-rose-500 text-white' : 'text-slate-600'
                }`}
              >
                支出
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                className={`flex-1 px-3 py-1.5 rounded-md text-sm ${
                  type === 'income' ? 'bg-emerald-500 text-white' : 'text-slate-600'
                }`}
              >
                收入
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">金额</label>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
              placeholder="0.00"
            />
            {errors.amount && <p className="mt-1 text-xs text-rose-600">{errors.amount}</p>}
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">日期</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
            {errors.date && <p className="mt-1 text-xs text-rose-600">{errors.date}</p>}
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">分类</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-300"
            >
              <option value="">请选择分类</option>
              {filteredCats.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {errors.category_id && <p className="mt-1 text-xs text-rose-600">{errors.category_id}</p>}
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">备注（可选）</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 min-h-[64px]"
              placeholder="选填，例如与谁一起、用途等"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 rounded-md border border-slate-200 text-sm text-slate-600 hover:bg-slate-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 rounded-md bg-slate-900 text-white text-sm hover:bg-slate-800 disabled:opacity-60"
            >
              {submitting ? '保存中…' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
