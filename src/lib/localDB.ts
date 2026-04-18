/**
 * Local in-browser "database" backed by localStorage.
 * Replaces all Supabase tables. Fully offline, no network calls.
 */

const KEYS = {
  users: 'cryptolock_users',
  profiles: 'cryptolock_profiles',
  messages: 'cryptolock_messages',
  recipients: 'cryptolock_recipients',
  seeded: 'cryptolock_seeded_v1',
} as const;

export interface LocalUser {
  id: string;
  email: string;
  password_hash: string;
  display_name: string;
  created_at: string;
}

export interface LocalProfile {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface LocalMessage {
  id: string;
  sender_id: string;
  content: string;
  lock_type: string;
  lock_config: any;
  is_encrypted: boolean;
  created_at: string;
  updated_at: string;
}

export interface LocalRecipient {
  id: string;
  message_id: string;
  recipient_id: string;
  is_unlocked: boolean;
  unlocked_at: string | null;
  created_at: string;
}

function uid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function read<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn(`[localDB] Failed to read ${key}, resetting.`, err);
    try { localStorage.removeItem(key); } catch {}
    return [];
  }
}

function write<T>(key: string, rows: T[]): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(rows));
    return true;
  } catch (err) {
    console.warn(`[localDB] Failed to write ${key} (quota?).`, err);
    return false;
  }
}

async function sha256(text: string): Promise<string> {
  try {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    // Last-resort fallback (not secure, but never crashes)
    return 'plain:' + text;
  }
}

function makeTable<T extends { id: string }>(key: string) {
  return {
    all(): T[] { return read<T>(key); },
    select(filter?: (r: T) => boolean): T[] {
      const rows = read<T>(key);
      return filter ? rows.filter(filter) : rows;
    },
    findBy(predicate: Partial<T>): T | null {
      const rows = read<T>(key);
      return rows.find(r =>
        Object.entries(predicate).every(([k, v]) => (r as any)[k] === v)
      ) ?? null;
    },
    insert(row: Omit<T, 'id'> & { id?: string }): T | null {
      const newRow = { ...row, id: row.id ?? uid() } as T;
      const rows = read<T>(key);
      rows.push(newRow);
      return write(key, rows) ? newRow : null;
    },
    update(id: string, patch: Partial<T>): T | null {
      const rows = read<T>(key);
      const idx = rows.findIndex(r => r.id === id);
      if (idx === -1) return null;
      rows[idx] = { ...rows[idx], ...patch };
      return write(key, rows) ? rows[idx] : null;
    },
    delete(id: string): boolean {
      const rows = read<T>(key).filter(r => r.id !== id);
      return write(key, rows);
    },
  };
}

export const db = {
  users: makeTable<LocalUser>(KEYS.users),
  profiles: makeTable<LocalProfile>(KEYS.profiles),
  messages: makeTable<LocalMessage>(KEYS.messages),
  recipients: makeTable<LocalRecipient>(KEYS.recipients),
};

export const localKeys = KEYS;
export { sha256, uid };

/** Seed two demo accounts so the app is testable with zero setup. */
export async function seedDemoData(): Promise<void> {
  try {
    if (localStorage.getItem(KEYS.seeded)) return;
    const demos = [
      { email: 'agent_a@local', display_name: 'Agent_A', password: 'password' },
      { email: 'agent_b@local', display_name: 'Agent_B', password: 'password' },
    ];
    for (const d of demos) {
      if (db.users.findBy({ email: d.email })) continue;
      const hash = await sha256(d.password);
      const id = uid();
      const now = new Date().toISOString();
      db.users.insert({ id, email: d.email, password_hash: hash, display_name: d.display_name, created_at: now });
      db.profiles.insert({
        id: uid(), user_id: id, display_name: d.display_name,
        avatar_url: null, created_at: now, updated_at: now,
      });
    }
    localStorage.setItem(KEYS.seeded, '1');
    console.info('[localDB] Demo accounts seeded: agent_a@local / agent_b@local (password: "password")');
  } catch (err) {
    console.warn('[localDB] Seeding failed', err);
  }
}
