import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, type AuthUser } from './api';

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .GET('/v1/auth/me')
      .then(({ data }) => setUser(data ?? null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string): Promise<void> {
    const { data, error } = await api.POST('/v1/auth/login', { body: { email, password } });
    if (error || !data) throw new Error('Credenciais inválidas');
    const me = await api.GET('/v1/auth/me');
    setUser(me.data ?? null);
  }

  async function logout(): Promise<void> {
    await api.POST('/v1/auth/logout');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
