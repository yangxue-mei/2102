import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../lib/auth';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-500 text-sm">加载中…</div>
      </div>
    );
  }
  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}
