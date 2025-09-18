import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';

type User = any;
type Account = any;

type AuthState = {
  token: string | null;
  user: User | null;
  account: Account | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (params: { accountName: string; planSlug?: string; email: string; password: string; passwordConfirmation: string; firstName?: string; lastName?: string; }) => Promise<boolean>;
  signOut: () => Promise<void>;
  reload: () => Promise<void>;
};

const AuthCtx = createContext<AuthState | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('auth_token'));
  const [user, setUser] = useState<User | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState<boolean>(!!token);

  const reload = useCallback(async () => {
    if (!token) return;
    const res = await api.profile(token);
    if (res.ok && res.data) {
      setUser(res.data.user);
      setAccount(res.data.account);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    if (token) reload();
  }, [token, reload]);

  const signIn = useCallback(async (email: string, password: string) => {
    const res = await api.signIn(email, password);
    if (!res.ok || !res.data) return false;
    localStorage.setItem('auth_token', res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
    return true;
  }, []);

  const signUp = useCallback(async ({ accountName, planSlug, email, password, passwordConfirmation, firstName, lastName }) => {
    const res = await api.signUp({ name: accountName, plan_slug: planSlug }, { email, password, password_confirmation: passwordConfirmation, first_name: firstName, last_name: lastName });
    if (!res.ok || !res.data) return false;
    localStorage.setItem('auth_token', res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
    setAccount(res.data.account);
    return true;
  }, []);

  const signOut = useCallback(async () => {
    const current = localStorage.getItem('auth_token');
    if (current) await api.signOut(current);
    localStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
    setAccount(null);
  }, []);

  const value = useMemo(() => ({ token, user, account, loading, signIn, signUp, signOut, reload }), [token, user, account, loading, signIn, signUp, signOut, reload]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

