import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { usernameToEmail } from './api';

interface AuthContextValue {
  session: Session | null;
  loading: boolean;
  userId: string | null;
  username: string | null;
  signIn: (username: string, password: string) => Promise<void>;
  signUp: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const usernameRef = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        setSession(data.session);
        if (data.session) {
          usernameRef.current = (data.session.user.user_metadata?.username as string) ?? null;
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        usernameRef.current = (newSession.user.user_metadata?.username as string) ?? null;
      } else {
        usernameRef.current = null;
      }
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signUp = useCallback(async (username: string, password: string) => {
    const email = usernameToEmail(username);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    if (error) throw error;
    // 部分环境会要求邮箱确认；这里如果直接拿到 session 就登录，否则提示用户
    if (!data.session && data.user && data.user.identities?.length === 0) {
      throw new Error('该用户名已被注册');
    }
  }, []);

  const signIn = useCallback(async (username: string, password: string) => {
    const email = usernameToEmail(username);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    session,
    loading,
    userId: session?.user?.id ?? null,
    username: usernameRef.current,
    signIn,
    signUp,
    signOut,
  }), [session, loading, signIn, signUp, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
