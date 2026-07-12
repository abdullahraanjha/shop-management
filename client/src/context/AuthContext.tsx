import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, setToken, getToken } from '@/lib/api';
import type { ApiEnvelope, User } from '@/types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount, if a token exists, restore the session.
  useEffect(() => {
    async function bootstrap() {
      if (!getToken()) return setLoading(false);
      try {
        const { data } = await api.get<ApiEnvelope<{ user: User }>>('/auth/me');
        setUser(data.data.user);
      } catch {
        setToken(null);
      } finally {
        setLoading(false);
      }
    }
    void bootstrap();
  }, []);

  async function login(email: string, password: string) {
    const { data } = await api.post<ApiEnvelope<{ user: User; token: string }>>('/auth/login', {
      email,
      password,
    });
    setToken(data.data.token);
    setUser(data.data.user);
  }

  async function logout() {
    try {
      await api.post('/auth/logout');
    } catch {
      /* ignore network errors on logout */
    }
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
