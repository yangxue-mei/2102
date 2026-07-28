import { useState } from 'react';
import Layout from '../components/Layout';
import PeriodPicker, { periodLabel, periodRange } from '../components/PeriodPicker';
import SummaryCards from '../components/SummaryCards';
import ExpensePieChart from '../components/ExpensePieChart';
import { Card } from '../components/ui';
import { useCategories, useTransactions } from '../hooks/use-data';
import { useToast } from '../components/Toast';
import { exportCSV, exportPDF } from '../lib/export';
import type { PeriodFilter } from '../types';

export default function Reports() {
  const now = new Date();
  const [period, setPeriod] = useState<PeriodFilter>({
    view: 'month',
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  });
  const { startDate, endDate } = periodRange(period);
  const { categories } = useCategories();
  const { items, loading } = useTransactions(startDate, endDate);
  const toast = useToast();
  const [pdfBusy, setPdfBusy] = useState(false);

  const handleCSV = () => {
    if (items.length === 0) {
      toast.info('当前周期没有可导出的记录');
      return;
    }
    try {
      exportCSV(items);
      toast.success('CSV 已开始下载');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'CSV 导出失败');
    }
  };

  const handlePDF = async () => {
    if (items.length === 0) {
      toast.info('当前周期没有可导出的记录');
      return;
    }
    setPdfBusy(true);
    try {
      await exportPDF(items, period);
      toast.success('PDF 已开始下载');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'PDF 导出失败');
    } finally {
      setPdfBusy(false);
    }
  };

  return (
    <Layout>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">报表导出</h1>
          <p className="text-xs text-slate-500 mt-1">{periodLabel(period)} 数据可携带</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <PeriodPicker value={period} onChange={setPeriod} />
          <button
            onClick={handleCSV}
            className="px-3 py-1.5 rounded-md border border-slate-200 text-sm text-slate-700 bg-white hover:bg-slate-50"
          >
            导出 CSV
          </button>
          <button
            onClick={handlePDF}
            disabled={pdfBusy}
            className="px-3 py-1.5 rounded-md bg-slate-900 text-white text-sm hover:bg-slate-800 disabled:opacity-60"
          >
            {pdfBusy ? '生成中…' : '导出 PDF'}
          </button>
        </div>
      </div>

      <div className="mb-4">
        <SummaryCards transactions={items} />
      </div>

      <Card title="支出分类占比（预览）">
        {loading ? (
          <div className="py-10 text-center text-sm text-slate-400">加载中…</div>
        ) : (
          <ExpensePieChart transactions={items} />
        )}
      </Card>

      <div className="mt-4 text-xs text-slate-500">
        CSV 表头：日期、类型、分类、金额、备注；PDF 为 A4 多页报表，包含报表时间段、收支汇总、分类占比图与明细清单。
      </div>
      <span className="hidden">{categories.length}</span>
    </Layout>
  );
}
