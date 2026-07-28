import { useState } from 'react';
import Layout from '../components/Layout';
import PeriodPicker, { periodLabel, periodRange } from '../components/PeriodPicker';
import SummaryCards from '../components/SummaryCards';
import TransactionList from '../components/TransactionList';
import TransactionForm, { type FormValue } from '../components/TransactionForm';
import { Card } from '../components/ui';
import { useCategories, useTransactions, useTransactionActions } from '../hooks/use-data';
import { useToast } from '../components/Toast';
import { exportCSV } from '../lib/export';
import type { PeriodFilter, TransactionWithCategory, TxType } from '../types';

export default function Transactions() {
  const now = new Date();
  const [period, setPeriod] = useState<PeriodFilter>({
    view: 'month',
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  });
  const [typeFilter, setTypeFilter] = useState<TxType | ''>('');
  const { startDate, endDate } = periodRange(period);
  const { categories } = useCategories();
  const { items, loading, reload } = useTransactions(startDate, endDate);
  const { upsert, remove } = useTransactionActions(reload, categories);
  const toast = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TransactionWithCategory | null>(null);

  const filtered = typeFilter ? items.filter((t) => t.type === typeFilter) : items;

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (t: TransactionWithCategory) => {
    setEditing(t);
    setFormOpen(true);
  };

  const handleSubmit = async (v: FormValue) => {
    try {
      await upsert(editing?.id ?? null, v);
      toast.success(editing ? '已更新账目' : '已新增账目');
      setFormOpen(false);
      setEditing(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '保存失败');
    }
  };

  const handleDelete = async (t: TransactionWithCategory) => {
    if (!confirm(`确定删除这笔 ${t.category?.name ?? '未分类'} 记录吗？`)) return;
    try {
      await remove(t.id);
      toast.success('已删除账目');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '删除失败');
    }
  };

  const handleCSV = () => {
    if (filtered.length === 0) {
      toast.info('当前筛选下没有可导出的记录');
      return;
    }
    try {
      exportCSV(filtered);
      toast.success('CSV 已开始下载');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'CSV 导出失败');
    }
  };

  return (
    <Layout>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">账目管理</h1>
          <p className="text-xs text-slate-500 mt-1">{periodLabel(period)} 明细</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <PeriodPicker value={period} onChange={setPeriod} />
          <button
            onClick={openCreate}
            className="px-3 py-1.5 rounded-md bg-slate-900 text-white text-sm hover:bg-slate-800"
          >
            + 新增
          </button>
        </div>
      </div>

      <div className="mb-4">
        <SummaryCards transactions={filtered} />
      </div>

      <Card
        title="账目列表"
        actions={
          <div className="flex items-center gap-2">
            <select
              className="border border-slate-200 bg-white rounded-md px-2 py-1.5 text-xs"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as TxType | '')}
              aria-label="按类型筛选"
            >
              <option value="">全部</option>
              <option value="expense">支出</option>
              <option value="income">收入</option>
            </select>
            <button
              onClick={handleCSV}
              className="px-3 py-1.5 rounded-md border border-slate-200 text-xs text-slate-700 bg-white hover:bg-slate-50"
            >
              导出 CSV
            </button>
          </div>
        }
      >
        {loading ? (
          <div className="py-10 text-center text-sm text-slate-400">加载中…</div>
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-400">
            当前筛选下暂无账目记录，点击右上角 + 新增
          </div>
        ) : (
          <TransactionList transactions={filtered} onEdit={openEdit} onDelete={handleDelete} />
        )}
      </Card>

      <TransactionForm
        open={formOpen}
        initial={editing}
        categories={categories}
        onSubmit={handleSubmit}
        onCancel={() => {
          setFormOpen(false);
          setEditing(null);
        }}
      />
    </Layout>
  );
}
