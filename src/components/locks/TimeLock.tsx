import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface TimeLockProps {
  unlockDate: string;
  onUnlock: () => void;
}

export default function TimeLock({ unlockDate, onUnlock }: TimeLockProps) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    const check = () => {
      const now = new Date();
      const target = new Date(unlockDate);
      const diff = target.getTime() - now.getTime();

      if (diff <= 0) {
        setIsUnlocked(true);
        setTimeLeft('UNLOCKED');
        onUnlock();
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${days}d ${hours}h ${mins}m ${secs}s`);
    };

    check();
    const interval = setInterval(check, 1000);
    return () => clearInterval(interval);
  }, [unlockDate, onUnlock]);

  return (
    <div className={`glass rounded-xl p-6 text-center ${isUnlocked ? 'border-primary/50 glow-primary' : 'border-destructive/30'}`}>
      <Clock className={`w-12 h-12 mx-auto mb-3 ${isUnlocked ? 'text-primary' : 'text-destructive'}`} />
      <h3 className="font-mono text-sm text-muted-foreground uppercase tracking-wider mb-2">Time Lock</h3>
      <p className={`font-mono text-2xl font-bold ${isUnlocked ? 'text-primary text-glow' : 'text-foreground'}`}>
        {timeLeft}
      </p>
      {!isUnlocked && (
        <p className="text-xs text-muted-foreground mt-2">
          Unlocks: {new Date(unlockDate).toLocaleString()}
        </p>
      )}
    </div>
  );
}
