import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { localAuth, MockUser, MockSession } from '@/lib/localAuth';

interface AuthContextType {
  user: MockUser | null;
  session: MockSession | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null);
  const [session, setSession] = useState<MockSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await localAuth.init();
      } catch (err) {
        console.warn('[useAuth] init failed', err);
      }
      if (!mounted) return;
      const s = localAuth.getSession();
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    })();

    const sub = localAuth.onAuthStateChange((s) => {
      setSession(s);
      setUser(s?.user ?? null);
    });

    return () => { mounted = false; sub.unsubscribe(); };
  }, []);

  const signUp = async (email: string, password: string, displayName: string) => {
    await localAuth.signUp(email, password, displayName);
  };
  const signIn = async (email: string, password: string) => {
    await localAuth.signIn(email, password);
  };
  const signOut = async () => {
    await localAuth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
