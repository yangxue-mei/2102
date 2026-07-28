import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useToast } from '../components/Toast';

export default function Login() {
  const { signIn } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username.trim()) {
      setError('请输入用户名');
      return;
    }
    if (!password) {
      setError('请输入密码');
      return;
    }
    setSubmitting(true);
    try {
      await signIn(username.trim(), password);
      toast.success('登录成功');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const friendly = /Invalid login credentials/i.test(msg)
        ? '用户名或密码错误'
        : /rate limit|over_request|request rate/i.test(msg)
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
          <h1 className="text-2xl font-semibold text-slate-900">个人账本</h1>
          <p className="text-sm text-slate-500 mt-1">记录每一笔，看清你的财务</p>
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
              placeholder="用户名或邮箱"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
              placeholder="至少 6 位"
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
            {submitting ? '登录中…' : '登录'}
          </button>
          <div className="text-xs text-slate-500 text-center">
            还没有账号？{' '}
            <Link to="/register" className="text-slate-900 underline underline-offset-2">
              立即注册
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
