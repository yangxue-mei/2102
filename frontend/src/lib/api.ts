import { supabase } from './supabase';
import type { Category, Transaction, TransactionWithCategory, TxType } from '../types';

// 把用户名归一化为 Supabase Auth 接受的邮箱形式
export function usernameToEmail(username: string): string {
  const u = username.trim();
  if (u.includes('@')) return u;
  return `${u}@ledger.local`;
}

// =====================================================================
// 分类
// =====================================================================
export async function listCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('type', { ascending: true })
    .order('name', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Category[];
}

export async function createCategory(name: string, type: TxType): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .insert({ name: name.trim(), type })
    .select()
    .single();
  if (error) throw error;
  return data as Category;
}

export async function updateCategory(id: string, name: string): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .update({ name: name.trim() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Category;
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
}

// =====================================================================
// 账目
// =====================================================================
export interface NewTransaction {
  amount: number;
  date: string;
  type: TxType;
  category_id: string | null;
  note?: string | null;
}

export async function listTransactions(opts: {
  startDate?: string;
  endDate?: string;
  type?: TxType;
}): Promise<TransactionWithCategory[]> {
  let q = supabase
    .from('transactions')
    .select('*, category:categories(*)')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });
  if (opts.startDate) q = q.gte('date', opts.startDate);
  if (opts.endDate) q = q.lte('date', opts.endDate);
  if (opts.type) q = q.eq('type', opts.type);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as unknown as TransactionWithCategory[];
}

export async function createTransaction(t: NewTransaction): Promise<Transaction> {
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      amount: t.amount,
      date: t.date,
      type: t.type,
      category_id: t.category_id,
      note: t.note ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Transaction;
}

export async function updateTransaction(id: string, t: NewTransaction): Promise<Transaction> {
  const { data, error } = await supabase
    .from('transactions')
    .update({
      amount: t.amount,
      date: t.date,
      type: t.type,
      category_id: t.category_id,
      note: t.note ?? null,
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Transaction;
}

export async function deleteTransaction(id: string): Promise<void> {
  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) throw error;
}
