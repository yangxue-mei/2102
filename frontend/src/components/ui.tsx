import type { ReactNode } from 'react';

export function EmptyState({ hint }: { hint: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-slate-400 text-sm">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
        <span className="text-xl">∅</span>
      </div>
      {hint}
    </div>
  );
}

export function Card({
  title,
  children,
  actions,
}: {
  title?: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      {(title || actions) && (
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-slate-100">
          <div className="text-sm font-semibold text-slate-800">{title}</div>
          {actions}
        </div>
      )}
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  );
}
