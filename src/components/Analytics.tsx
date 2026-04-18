import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/localDB';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts';
import { BarChart3 } from 'lucide-react';

interface Stats {
  totalSent: number;
  totalReceived: number;
  totalUnlocked: number;
  totalLocked: number;
  lockTypeBreakdown: { name: string; value: number }[];
  activityData: { date: string; sent: number; received: number }[];
}

const COLORS = ['hsl(155,100%,50%)', 'hsl(190,100%,50%)', 'hsl(280,80%,60%)', 'hsl(45,100%,50%)'];

export default function Analytics() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalSent: 0, totalReceived: 0, totalUnlocked: 0, totalLocked: 0,
    lockTypeBreakdown: [], activityData: [],
  });

  useEffect(() => {
    if (!user) return;
    try {
      const sent = db.messages.select(m => m.sender_id === user.id);
      const received = db.recipients.select(r => r.recipient_id === user.id);
      const unlocked = received.filter(r => r.is_unlocked).length;

      const typeCount: Record<string, number> = {};
      sent.forEach(m => { typeCount[m.lock_type] = (typeCount[m.lock_type] || 0) + 1; });
      const lockTypeBreakdown = Object.entries(typeCount).map(([name, value]) => ({
        name: name.replace('_', ' '),
        value,
      }));

      const days: Record<string, { sent: number; received: number }> = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        days[key] = { sent: 0, received: 0 };
      }
      sent.forEach(m => {
        const key = (m.created_at || '').split('T')[0];
        if (days[key]) days[key].sent++;
      });
      received.forEach(r => {
        const key = (r.created_at || '').split('T')[0];
        if (days[key]) days[key].received++;
      });
      const activityData = Object.entries(days).map(([date, v]) => ({
        date: date.slice(5),
        ...v,
      }));

      setStats({
        totalSent: sent.length,
        totalReceived: received.length,
        totalUnlocked: unlocked,
        totalLocked: received.length - unlocked,
        lockTypeBreakdown,
        activityData,
      });
    } catch (err) {
      console.warn('[Analytics] failed', err);
    }
  }, [user]);

  const statCards = [
    { label: 'Messages Sent', value: stats.totalSent, color: 'text-primary' },
    { label: 'Messages Received', value: stats.totalReceived, color: 'text-secondary' },
    { label: 'Unlocked', value: stats.totalUnlocked, color: 'text-primary' },
    { label: 'Still Locked', value: stats.totalLocked, color: 'text-destructive' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="font-mono text-lg font-semibold flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-primary" />
        Analytics Dashboard
      </h2>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map(s => (
          <div key={s.label} className="glass rounded-xl p-4 text-center">
            <p className={`font-mono text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground font-mono mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Activity Chart */}
        <div className="glass rounded-xl p-4">
          <h3 className="text-sm font-mono text-muted-foreground mb-3">7-Day Activity</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={stats.activityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,18%)" />
              <XAxis dataKey="date" stroke="hsl(220,10%,55%)" fontSize={10} fontFamily="JetBrains Mono" />
              <YAxis stroke="hsl(220,10%,55%)" fontSize={10} fontFamily="JetBrains Mono" />
              <Tooltip contentStyle={{ background: 'hsl(220,20%,10%)', border: '1px solid hsl(220,15%,18%)', borderRadius: '8px', fontFamily: 'JetBrains Mono', fontSize: 12 }} />
              <Line type="monotone" dataKey="sent" stroke="hsl(155,100%,50%)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="received" stroke="hsl(190,100%,50%)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Lock Type Pie */}
        <div className="glass rounded-xl p-4">
          <h3 className="text-sm font-mono text-muted-foreground mb-3">Lock Types Used</h3>
          {stats.lockTypeBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={stats.lockTypeBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                  {stats.lockTypeBreakdown.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'hsl(220,20%,10%)', border: '1px solid hsl(220,15%,18%)', borderRadius: '8px', fontFamily: 'JetBrains Mono', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground font-mono text-sm">No data yet</div>
          )}
        </div>
      </div>
    </div>
  );
}
