export type TxType = 'income' | 'expense';

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: TxType;
  is_preset: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  date: string; // YYYY-MM-DD
  type: TxType;
  category_id: string | null;
  note: string | null;
  created_at: string;
}

export interface TransactionWithCategory extends Transaction {
  category?: Category | null;
}

export interface PeriodFilter {
  view: 'month' | 'year';
  year: number;
  month: number; // 1-12, used when view === 'month'
}
