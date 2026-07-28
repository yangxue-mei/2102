import { useCallback, useEffect, useState } from 'react';
import type { Category, TransactionWithCategory } from '../types';
import {
  listCategories,
  listTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  type NewTransaction,
} from '../lib/api';
import { supabase } from '../lib/supabase';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await listCategories();
      setCategories(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { categories, loading, error, reload, setCategories };
}

export function useTransactions(startISO?: string, endISO?: string) {
  const [items, setItems] = useState<TransactionWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!startISO || !endISO) return;
    setLoading(true);
    setError(null);
    try {
      const list = await listTransactions({ startDate: startISO, endDate: endISO });
      setItems(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [startISO, endISO]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { items, loading, error, reload, setItems };
}

export function useTransactionActions(reload: () => Promise<void>, categories: Category[]) {
  const upsert = useCallback(
    async (id: string | null, v: { amount: string; date: string; type: 'income' | 'expense'; category_id: string; note: string }) => {
      const payload: NewTransaction = {
        amount: Number(v.amount),
        date: v.date,
        type: v.type,
        category_id: v.category_id || null,
        note: v.note || null,
      };
      if (id) {
        await updateTransaction(id, payload);
      } else {
        await createTransaction(payload);
      }
      await reload();
    },
    [reload],
  );

  const remove = useCallback(
    async (id: string) => {
      await deleteTransaction(id);
      await reload();
    },
    [reload],
  );

  return { upsert, remove };
}

// 订阅当前用户登录态变化，触发上层重新拉取（用于登出后清理等）
export function useAuthChange(cb: () => void) {
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange(() => cb());
    return () => sub.subscription.unsubscribe();
  }, [cb]);
}
