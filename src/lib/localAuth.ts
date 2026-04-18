/**
 * Mock authentication backed by localStorage. No network, no email verification.
 */
import { db, sha256, uid, seedDemoData } from './localDB';

export interface MockUser {
  id: string;
  email: string;
  user_metadata: { display_name: string };
}

export interface MockSession {
  user: MockUser;
  access_token: string;
}

const SESSION_KEY = 'cryptolock_session';
const EVENT_NAME = 'cryptolock-auth';

function emit() {
  try { window.dispatchEvent(new Event(EVENT_NAME)); } catch {}
}

function persistSession(session: MockSession | null) {
  try {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
  } catch (err) {
    console.warn('[localAuth] Failed to persist session', err);
  }
}

function readSession(): MockSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) as MockSession : null;
  } catch {
    return null;
  }
}

export const localAuth = {
  async init() {
    await seedDemoData();
  },

  getSession(): MockSession | null {
    return readSession();
  },

  async signUp(email: string, password: string, displayName: string): Promise<MockSession> {
    if (!email || !password) throw new Error('Email and password are required');
    if (password.length < 6) throw new Error('Password must be at least 6 characters');
    if (db.users.findBy({ email })) throw new Error('An account with this email already exists');

    const hash = await sha256(password);
    const id = uid();
    const now = new Date().toISOString();
    const name = displayName?.trim() || email.split('@')[0];

    const user = db.users.insert({
      id, email, password_hash: hash, display_name: name, created_at: now,
    });
    if (!user) throw new Error('Failed to create account (storage full?)');

    db.profiles.insert({
      id: uid(), user_id: id, display_name: name,
      avatar_url: null, created_at: now, updated_at: now,
    });

    const session: MockSession = {
      user: { id, email, user_metadata: { display_name: name } },
      access_token: 'local-' + uid(),
    };
    persistSession(session);
    emit();
    return session;
  },

  async signIn(email: string, password: string): Promise<MockSession> {
    const user = db.users.findBy({ email });
    if (!user) throw new Error('Invalid email or password');
    const hash = await sha256(password);
    if (hash !== user.password_hash) throw new Error('Invalid email or password');

    const session: MockSession = {
      user: { id: user.id, email: user.email, user_metadata: { display_name: user.display_name } },
      access_token: 'local-' + uid(),
    };
    persistSession(session);
    emit();
    return session;
  },

  async signOut(): Promise<void> {
    persistSession(null);
    emit();
  },

  onAuthStateChange(cb: (session: MockSession | null) => void): { unsubscribe: () => void } {
    const handler = () => cb(readSession());
    window.addEventListener(EVENT_NAME, handler);
    window.addEventListener('storage', handler);
    return {
      unsubscribe: () => {
        window.removeEventListener(EVENT_NAME, handler);
        window.removeEventListener('storage', handler);
      },
    };
  },
};
