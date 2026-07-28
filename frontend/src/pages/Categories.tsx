import { useState } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import Layout from '../components/Layout';
import { Card } from '../components/ui';
import { useCategories } from '../hooks/use-data';
import { useToast } from '../components/Toast';
import { createCategory, updateCategory, deleteCategory } from '../lib/api';
import type { Category, TxType } from '../types';

export default function Categories() {
  const { categories, loading, reload } = useCategories();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<TxType>('expense');

  const openCreate = () => {
    setEditing(null);
    setName('');
    setType('expense');
    setOpen(true);
  };
  const openEdit = (c: Category) => {
    setEditing(c);
    setName(c.name);
    setType(c.type);
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('请输入分类名称');
      return;
    }
    try {
      if (editing) {
        await updateCategory(editing.id, name);
        toast.success('分类已更新');
      } else {
        await createCategory(name, type);
        toast.success('分类已新增');
      }
      setOpen(false);
      await reload();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const friendly = /duplicate/i.test(msg) ? '该类型下已存在同名分类' : msg;
      toast.error(friendly);
    }
  };

  const handleDelete = async (c: Category) => {
    if (c.is_preset) {
      toast.info('预设分类不建议删除；如需重命名请编辑');
      return;
    }
    if (!confirm(`确定删除分类「${c.name}」吗？已有账目将变为「未分类」`)) return;
    try {
      await deleteCategory(c.id);
      toast.success('分类已删除');
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : '删除失败');
    }
  };

  const income = categories.filter((c) => c.type === 'income');
  const expense = categories.filter((c) => c.type === 'expense');

  return (
    <Layout>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">分类管理</h1>
          <p className="text-xs text-slate-500 mt-1">管理你的收支分类标签</p>
        </div>
        <button
          onClick={openCreate}
          className="px-3 py-1.5 rounded-md bg-slate-900 text-white text-sm hover:bg-slate-800 flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          新增分类
        </button>
      </div>

      {loading ? (
        <div className="py-10 text-center text-sm text-slate-400">加载中…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card title={<span className="text-rose-700">支出分类（{expense.length}）</span>}>
            <CategoryList items={expense} onEdit={openEdit} onDelete={handleDelete} />
          </Card>
          <Card title={<span className="text-emerald-700">收入分类（{income.length}）</span>}>
            <CategoryList items={income} onEdit={openEdit} onDelete={handleDelete} />
          </Card>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl shadow-xl">
            <div className="px-5 pt-5 pb-2 flex items-center justify-between">
              <h3 className="text-base font-semibold">{editing ? '编辑分类' : '新增分类'}</h3>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded hover:bg-slate-100" aria-label="关闭">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-5 pb-5 flex flex-col gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">分类名称</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={20}
                  className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                  placeholder="如 零食、副业"
                />
              </div>
              {!editing && (
                <div>
                  <label className="block text-xs text-slate-500 mb-1">分类类型</label>
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
              )}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 px-4 py-2 rounded-md border border-slate-200 text-sm text-slate-600 hover:bg-slate-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-md bg-slate-900 text-white text-sm hover:bg-slate-800"
                >
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}

function CategoryList({
  items,
  onEdit,
  onDelete,
}: {
  items: Category[];
  onEdit: (c: Category) => void;
  onDelete: (c: Category) => void;
}) {
  if (items.length === 0) {
    return <div className="py-6 text-center text-sm text-slate-400">暂无分类</div>;
  }
  return (
    <ul className="divide-y divide-slate-100">
      {items.map((c) => (
        <li key={c.id} className="flex items-center gap-3 py-2.5">
          <div className="min-w-0 flex-1">
            <span className="text-sm text-slate-800">{c.name}</span>
            {c.is_preset && (
              <span className="ml-2 inline-block text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                预设
              </span>
            )}
          </div>
          <button onClick={() => onEdit(c)} className="p-1.5 rounded hover:bg-slate-100 text-slate-500" aria-label="编辑">
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(c)}
            className="p-1.5 rounded hover:bg-rose-50 text-rose-500"
            aria-label="删除"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </li>
      ))}
    </ul>
  );
}
