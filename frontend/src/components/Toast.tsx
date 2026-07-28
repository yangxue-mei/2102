import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

type ToastKind = 'success' | 'error' | 'info';
interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastContextValue {
  push: (kind: ToastKind, message: string) => void;
  success: (m: string) => void;
  error: (m: string) => void;
  info: (m: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((kind: ToastKind, message: string) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, kind, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2800);
  }, []);
  const success = useCallback((m: string) => push('success', m), [push]);
  const error = useCallback((m: string) => push('error', m), [push]);
  const info = useCallback((m: string) => push('info', m), [push]);
  const value = useMemo<ToastContextValue>(() => ({ push, success, error, info }), [push, success, error, info]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-[90vw] sm:max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`flex items-start gap-2 rounded-lg px-4 py-3 shadow-lg ring-1 text-sm ${
              t.kind === 'success'
                ? 'bg-emerald-50 text-emerald-800 ring-emerald-200'
                : t.kind === 'error'
                ? 'bg-rose-50 text-rose-800 ring-rose-200'
                : 'bg-slate-50 text-slate-800 ring-slate-200'
            }`}
          >
            {t.kind === 'success' ? (
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
            ) : t.kind === 'error' ? (
              <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
            ) : (
              <Info className="w-4 h-4 mt-0.5 shrink-0" />
            )}
            <span className="flex-1 break-words">{t.message}</span>
            <button
              onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
              className="shrink-0 opacity-60 hover:opacity-100"
              aria-label="关闭提示"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
