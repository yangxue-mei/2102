import { NavLink, useNavigate } from 'react-router-dom';
import { useState, type ReactNode } from 'react';
import {
  LayoutDashboard,
  Receipt,
  Tags,
  FileText,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useToast } from './Toast';

const NAV = [
  { to: '/dashboard', label: '仪表盘', icon: LayoutDashboard },
  { to: '/transactions', label: '账目', icon: Receipt },
  { to: '/categories', label: '分类管理', icon: Tags },
  { to: '/reports', label: '报表导出', icon: FileText },
];

export default function Layout({ children }: { children: ReactNode }) {
  const { username, signOut } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    toast.success('已退出登录');
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-50 text-slate-800">
      {/* PC 侧栏 */}
      <aside className="hidden md:flex md:flex-col md:w-60 md:shrink-0 border-r border-slate-200 bg-white">
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <span className="text-lg font-semibold text-slate-900">个人账本</span>
        </div>
        <nav className="flex-1 p-3 flex flex-col gap-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-100">
          <div className="px-3 py-2 text-xs text-slate-500">当前用户</div>
          <div className="px-3 pb-2 text-sm font-medium text-slate-800 truncate">{username ?? '—'}</div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100"
          >
            <LogOut className="w-4 h-4" />
            退出登录
          </button>
        </div>
      </aside>

      {/* 移动端顶栏 */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4">
        <span className="font-semibold text-slate-900">个人账本</span>
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-lg hover:bg-slate-100"
          aria-label="打开菜单"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {open && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-64 bg-white shadow-xl flex flex-col">
            <div className="h-14 flex items-center justify-between px-4 border-b border-slate-100">
              <span className="font-semibold">菜单</span>
              <button onClick={() => setOpen(false)} className="p-2 rounded hover:bg-slate-100" aria-label="关闭菜单">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 p-3 flex flex-col gap-1">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                      isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <div className="p-3 border-t border-slate-100">
              <div className="px-3 pb-1 text-xs text-slate-500">当前用户</div>
              <div className="px-3 pb-2 text-sm font-medium truncate">{username ?? '—'}</div>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100"
              >
                <LogOut className="w-4 h-4" />
                退出登录
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 min-w-0 md:pt-0 pt-14">
        <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
