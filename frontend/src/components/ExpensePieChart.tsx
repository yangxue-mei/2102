import { useEffect, useMemo, useState } from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  type ChartOptions,
} from 'chart.js';
import type { TransactionWithCategory } from '../types';
import { formatMoney, pickColor } from '../lib/format';
import { EmptyState } from './ui';

ChartJS.register(ArcElement, Tooltip, Legend);

interface Props {
  transactions: TransactionWithCategory[];
}

export default function ExpensePieChart({ transactions }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const data = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of transactions) {
      if (t.type !== 'expense') continue;
      const name = t.category?.name ?? '未分类';
      map.set(name, (map.get(name) ?? 0) + Number(t.amount));
    }
    const entries = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
    return {
      labels: entries.map(([k]) => k),
      values: entries.map(([, v]) => v),
    };
  }, [transactions]);

  if (data.labels.length === 0) {
    return <EmptyState hint="当前周期内暂无支出记录" />;
  }

  const total = data.values.reduce((a, b) => a + b, 0);
  const chartData = {
    labels: data.labels,
    datasets: [
      {
        data: data.values,
        backgroundColor: data.labels.map((_, i) => pickColor(i)),
        borderColor: '#ffffff',
        borderWidth: 2,
      },
    ],
  };
  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: { boxWidth: 12, font: { size: 12 } },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const v = Number(ctx.parsed);
            const pct = total > 0 ? ((v / total) * 100).toFixed(1) : '0';
            return `${ctx.label}: ${formatMoney(v)} (${pct}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="h-72 sm:h-80">
      {mounted && <Doughnut data={chartData} options={options} />}
    </div>
  );
}
