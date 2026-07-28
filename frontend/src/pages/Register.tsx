import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useToast } from '../components/Toast';

export default function Register() {
  const { signUp } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username.trim()) {
      setError('请输入用户名');
      return;
    }
    if (!/^[A-Za-z0-9_.@-]{3,32}$/.test(username.trim())) {
      setError('用户名需为 3-32 位字母、数字或 _ . @ -');
      return;
    }
    if (password.length < 6) {
      setError('密码至少 6 位');
      return;
    }
    if (password !== confirm) {
      setError('两次输入的密码不一致');
      return;
    }
    setSubmitting(true);
    try {
      await signUp(username.trim(), password);
      toast.success('注册成功，正在进入…');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const friendly = /already.*registered|User already registered/i.test(msg)
        ? '该用户名已被注册'
        : /rate limit/i.test(msg)
        ? '请求过于频繁，请稍后再试'
        : msg;
      setError(friendly);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">注册账号</h1>
          <p className="text-sm text-slate-500 mt-1">数据按用户隔离，仅你能查看</p>
        </div>
        <form
          onSubmit={onSubmit}
          className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col gap-4"
        >
          <div>
            <label className="block text-xs text-slate-500 mb-1">用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
              placeholder="3-32 位字母/数字"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
              placeholder="至少 6 位"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">确认密码</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
              placeholder="再次输入密码"
            />
          </div>
          {error && (
            <div className="text-xs text-rose-700 bg-rose-50 ring-1 ring-rose-200 rounded-md px-3 py-2">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-md py-2 text-sm disabled:opacity-60"
          >
            {submitting ? '注册中…' : '注册并登录'}
          </button>
          <div className="text-xs text-slate-500 text-center">
            已有账号？{' '}
            <Link to="/login" className="text-slate-900 underline underline-offset-2">
              前往登录
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
