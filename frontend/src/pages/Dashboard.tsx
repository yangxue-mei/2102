import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import PeriodPicker, { periodLabel, periodRange } from '../components/PeriodPicker';
import SummaryCards from '../components/SummaryCards';
import ExpensePieChart from '../components/ExpensePieChart';
import TransactionList from '../components/TransactionList';
import TransactionForm, { type FormValue } from '../components/TransactionForm';
import { Card } from '../components/ui';
import { useCategories, useTransactions, useTransactionActions } from '../hooks/use-data';
import { useToast } from '../components/Toast';
import type { PeriodFilter, TransactionWithCategory } from '../types';

export default function Dashboard() {
  const navigate = useNavigate();
  const now = new Date();
  const [period, setPeriod] = useState<PeriodFilter>({
    view: 'month',
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  });
  const { startDate, endDate } = periodRange(period);
  const { categories } = useCategories();
  const { items, loading, reload } = useTransactions(startDate, endDate);
  const { upsert, remove } = useTransactionActions(reload, categories);
  const toast = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TransactionWithCategory | null>(null);

  const recent = useMemo(() => items.slice(0, 8), [items]);

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

  return (
    <Layout>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">仪表盘</h1>
          <p className="text-xs text-slate-500 mt-1">{periodLabel(period)} 收支概览</p>
        </div>
        <div className="flex items-center gap-2">
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
        <SummaryCards transactions={items} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card title="支出分类占比">
          {loading ? (
            <div className="py-10 text-center text-sm text-slate-400">加载中…</div>
          ) : (
            <ExpensePieChart transactions={items} />
          )}
        </Card>
        <div className="lg:col-span-3">
          <Card
            title="最近账目"
            actions={
              <button
                className="text-xs text-slate-500 hover:text-slate-800"
                onClick={() => navigate('/transactions')}
              >
                查看全部 →
              </button>
            }
          >
            {loading ? (
              <div className="py-10 text-center text-sm text-slate-400">加载中…</div>
            ) : recent.length === 0 ? (
              <div className="py-10 text-center text-sm text-slate-400">当前周期内暂无账目记录</div>
            ) : (
              <TransactionList transactions={recent} onEdit={openEdit} onDelete={handleDelete} />
            )}
          </Card>
        </div>
      </div>

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
