import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { TransactionWithCategory, PeriodFilter } from '../types';
import { formatMoney, typeLabel } from './format';
import { periodLabel } from '../components/PeriodPicker';

// =====================================================================
// CSV 导出
// =====================================================================
function csvEscape(v: string): string {
  const s = v ?? '';
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function exportCSV(transactions: TransactionWithCategory[]): void {
  const header = ['日期', '类型', '分类', '金额', '备注'];
  const rows = transactions.map((t) => [
    t.date,
    typeLabel(t.type),
    t.category?.name ?? '未分类',
    Number(t.amount).toFixed(2),
    t.note ?? '',
  ]);
  const csv = [header, ...rows].map((r) => r.map(csvEscape).join(',')).join('\r\n');
  // 加 BOM 让 Excel 正确识别 UTF-8
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, `账目导出_${Date.now()}.csv`);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// =====================================================================
// PDF 导出（html2canvas + jsPDF，A4 多页）
// =====================================================================
export async function exportPDF(
  transactions: TransactionWithCategory[],
  period: PeriodFilter,
): Promise<void> {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-99999px';
  container.style.top = '0';
  container.style.width = '794px'; // ~ A4 @ 96 DPI
  container.style.background = '#ffffff';
  container.style.padding = '32px';
  container.style.fontFamily = '"PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif';
  container.style.color = '#0f172a';
  container.style.fontSize = '13px';

  let income = 0;
  let expense = 0;
  const byCategory = new Map<string, number>();
  for (const t of transactions) {
    if (t.type === 'income') income += Number(t.amount);
    else {
      expense += Number(t.amount);
      const k = t.category?.name ?? '未分类';
      byCategory.set(k, (byCategory.get(k) ?? 0) + Number(t.amount));
    }
  }
  const balance = income - expense;
  const catEntries = Array.from(byCategory.entries()).sort((a, b) => b[1] - a[1]);
  const totalExpense = catEntries.reduce((a, [, v]) => a + v, 0);

  const palette = ['#ef4444', '#f97316', '#f59e0b', '#e11d48', '#db2777', '#f43f5e', '#fb7185', '#fda4af', '#fbcfe8', '#fecdd3'];

  const rowsHtml = transactions
    .slice(0, 200)
    .map((t) => {
      const sign = t.type === 'income' ? '+' : '-';
      const color = t.type === 'income' ? '#059669' : '#e11d48';
      return `
        <tr>
          <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;">${t.date}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;">${typeLabel(t.type)}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;">${t.category?.name ?? '未分类'}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;color:${color};font-weight:600;text-align:right;">${sign}${formatMoney(Number(t.amount)).replace('-', '').replace('¥', '¥')}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;color:#475569;">${t.note ?? ''}</td>
        </tr>`;
    })
    .join('');

  // 简单 SVG 饼图
  let pieSvg = '<div style="color:#94a3b8;font-size:12px;padding:8px 0;">暂无支出数据</div>';
  if (catEntries.length > 0) {
    const r = 70;
    const cx = 80;
    const cy = 80;
    let acc = 0;
    const total = totalExpense;
    const slices = catEntries.map(([name, v], i) => {
      const start = (acc / total) * 2 * Math.PI - Math.PI / 2;
      acc += v;
      const end = (acc / total) * 2 * Math.PI - Math.PI / 2;
      const large = end - start > Math.PI ? 1 : 0;
      const x1 = cx + r * Math.cos(start);
      const y1 = cy + r * Math.sin(start);
      const x2 = cx + r * Math.cos(end);
      const y2 = cy + r * Math.sin(end);
      const color = palette[i % palette.length];
      const pct = ((v / total) * 100).toFixed(1);
      return {
        path: `<path d="M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z" fill="${color}" stroke="#fff" stroke-width="1.5"/>`,
        name,
        color,
        pct,
        value: v,
      };
    });
    const legend = slices
      .map(
        (s) =>
          `<div style="display:flex;align-items:center;gap:6px;font-size:12px;margin:2px 0;">
            <span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${s.color};"></span>
            <span style="flex:1;">${s.name}</span>
            <span style="color:#64748b;">${formatMoney(s.value)}</span>
            <span style="color:#94a3b8;width:48px;text-align:right;">${s.pct}%</span>
          </div>`,
      )
      .join('');
    pieSvg = `
      <div style="display:flex;align-items:center;gap:24px;">
        <svg width="160" height="160" viewBox="0 0 160 160">${slices.map((s) => s.path).join('')}</svg>
        <div style="flex:1;min-width:0;">${legend}</div>
      </div>`;
  }

  container.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #0f172a;padding-bottom:12px;">
      <div>
        <div style="font-size:20px;font-weight:700;">个人账本报表</div>
        <div style="font-size:12px;color:#64748b;margin-top:4px;">报表时间段：${periodLabel(period)}</div>
      </div>
      <div style="font-size:11px;color:#94a3b8;">生成时间 ${new Date().toLocaleString('zh-CN')}</div>
    </div>

    <div style="margin-top:16px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">
      <div style="border:1px solid #d1fae5;background:#ecfdf5;border-radius:8px;padding:10px;">
        <div style="font-size:12px;color:#047857;">收入</div>
        <div style="font-size:18px;font-weight:700;color:#047857;margin-top:4px;">${formatMoney(income)}</div>
      </div>
      <div style="border:1px solid #fecdd3;background:#fff1f2;border-radius:8px;padding:10px;">
        <div style="font-size:12px;color:#be123c;">支出</div>
        <div style="font-size:18px;font-weight:700;color:#be123c;margin-top:4px;">${formatMoney(expense)}</div>
      </div>
      <div style="border:1px solid #e2e8f0;border-radius:8px;padding:10px;">
        <div style="font-size:12px;color:#475569;">结余</div>
        <div style="font-size:18px;font-weight:700;margin-top:4px;">${formatMoney(balance)}</div>
      </div>
    </div>

    <div style="margin-top:20px;font-size:14px;font-weight:600;border-left:4px solid #0f172a;padding-left:8px;">支出分类占比</div>
    <div style="margin-top:8px;">${pieSvg}</div>

    <div style="margin-top:20px;font-size:14px;font-weight:600;border-left:4px solid #0f172a;padding-left:8px;">明细清单${transactions.length > 200 ? `（仅展示前 200 条，共 ${transactions.length} 条）` : `（共 ${transactions.length} 条）`}</div>
    <table style="width:100%;border-collapse:collapse;margin-top:8px;font-size:12px;">
      <thead>
        <tr style="background:#f1f5f9;text-align:left;">
          <th style="padding:6px 8px;">日期</th>
          <th style="padding:6px 8px;">类型</th>
          <th style="padding:6px 8px;">分类</th>
          <th style="padding:6px 8px;text-align:right;">金额</th>
          <th style="padding:6px 8px;">备注</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>
  `;

  document.body.appendChild(container);
  try {
    const canvas = await html2canvas(container, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const imgWidth = pageWidth - margin * 2;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let position = margin;
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', margin, position, imgWidth, imgHeight);
    let remaining = imgHeight - (pageHeight - margin * 2);
    while (remaining > 0) {
      position = margin - (imgHeight - remaining);
      pdf.addPage();
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', margin, position, imgWidth, imgHeight);
      remaining -= (pageHeight - margin * 2);
    }
    pdf.save(`个人账本报表_${periodLabel(period)}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}

function triggerDownload(url: string, filename: string): void {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
