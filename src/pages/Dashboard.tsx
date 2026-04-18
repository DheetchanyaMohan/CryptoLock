import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/localDB';
import { useNavigate } from 'react-router-dom';
import SendMessage from '@/components/SendMessage';
import MessageCard from '@/components/MessageCard';
import EncryptDecryptTool from '@/components/EncryptDecryptTool';
import Analytics from '@/components/Analytics';
import { Button } from '@/components/ui/button';
import { Shield, Inbox, Send, BarChart3, ShieldCheck, LogOut, Menu, X } from 'lucide-react';

type Tab = 'inbox' | 'send' | 'sent' | 'analytics' | 'tools';

interface MessageWithSender {
  id: string;
  content: string;
  lock_type: string;
  lock_config: any;
  is_encrypted: boolean;
  created_at: string;
  sender_id: string;
  senderName?: string;
  recipientEntry?: { id: string; is_unlocked: boolean };
}

export default function Dashboard() {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('inbox');
  const [inboxMessages, setInboxMessages] = useState<MessageWithSender[]>([]);
  const [sentMessages, setSentMessages] = useState<MessageWithSender[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    fetchMessages();
  }, [user, refreshKey]);

  const fetchMessages = () => {
    if (!user) return;
    try {
      const recipientEntries = db.recipients.select(r => r.recipient_id === user.id);
      const messageIds = new Set(recipientEntries.map(r => r.message_id));
      const inboxMsgs = db.messages.select(m => messageIds.has(m.id));
      const profiles = db.profiles.all();
      const profileMap = new Map(profiles.map(p => [p.user_id, p.display_name]));

      setInboxMessages(inboxMsgs.map(m => ({
        ...m,
        senderName: profileMap.get(m.sender_id) || 'Unknown',
        recipientEntry: recipientEntries.find(r => r.message_id === m.id),
      })));

      const sent = db.messages.select(m => m.sender_id === user.id)
        .sort((a, b) => b.created_at.localeCompare(a.created_at));
      setSentMessages(sent.map(m => ({ ...m })));
    } catch (err) {
      console.warn('[Dashboard] fetchMessages failed', err);
      setInboxMessages([]);
      setSentMessages([]);
    }
  };

  const TABS = [
    { id: 'inbox' as Tab, label: 'Inbox', icon: Inbox },
    { id: 'send' as Tab, label: 'Send', icon: Send },
    { id: 'sent' as Tab, label: 'Sent', icon: Send },
    { id: 'analytics' as Tab, label: 'Analytics', icon: BarChart3 },
    { id: 'tools' as Tab, label: 'Tools', icon: ShieldCheck },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse-glow w-12 h-12 rounded-full bg-primary/20 border border-primary/50" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border glass sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <span className="font-mono font-bold text-foreground text-glow">CryptoLock</span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-mono transition-all ${
                  tab === t.id
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <t.icon className="w-4 h-4" />
                {t.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground hidden md:block">
              {user?.email}
            </span>
            <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground font-mono">
              <LogOut className="w-4 h-4" />
            </Button>
            <button
              className="md:hidden text-muted-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border p-3 flex flex-wrap gap-2">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setMobileMenuOpen(false); }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-mono transition-all ${
                  tab === t.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
                }`}
              >
                <t.icon className="w-4 h-4" />
                {t.label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {tab === 'inbox' && (
          <div className="space-y-4">
            <h2 className="font-mono text-lg font-semibold flex items-center gap-2">
              <Inbox className="w-5 h-5 text-primary" />
              Inbox
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-mono">
                {inboxMessages.length}
              </span>
            </h2>
            {inboxMessages.length === 0 ? (
              <div className="glass rounded-2xl p-12 text-center">
                <Inbox className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="font-mono text-muted-foreground">No messages yet</p>
              </div>
            ) : (
              inboxMessages.map(m => (
                <MessageCard key={m.id} message={m} recipientEntry={m.recipientEntry} senderName={m.senderName} />
              ))
            )}
          </div>
        )}

        {tab === 'send' && (
          <SendMessage onSent={() => setRefreshKey(k => k + 1)} />
        )}

        {tab === 'sent' && (
          <div className="space-y-4">
            <h2 className="font-mono text-lg font-semibold flex items-center gap-2">
              <Send className="w-5 h-5 text-primary" />
              Sent Messages
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-mono">
                {sentMessages.length}
              </span>
            </h2>
            {sentMessages.length === 0 ? (
              <div className="glass rounded-2xl p-12 text-center">
                <Send className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="font-mono text-muted-foreground">No sent messages yet</p>
              </div>
            ) : (
              sentMessages.map(m => (
                <MessageCard key={m.id} message={m} isOwnMessage />
              ))
            )}
          </div>
        )}

        {tab === 'analytics' && <Analytics />}

        {tab === 'tools' && <EncryptDecryptTool />}
      </main>
    </div>
  );
}
