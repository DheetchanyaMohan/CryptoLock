import { useState } from 'react';
import { KeyRound } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SecretCodeLockProps {
  code: string;
  hint?: string;
  onUnlock: () => void;
}

export default function SecretCodeLock({ code, hint, onUnlock }: SecretCodeLockProps) {
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'wrong' | 'correct'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.toLowerCase().trim() === code.toLowerCase().trim()) {
      setStatus('correct');
      onUnlock();
    } else {
      setStatus('wrong');
      setTimeout(() => setStatus('idle'), 1500);
    }
  };

  return (
    <div className={`glass rounded-xl p-6 text-center ${status === 'correct' ? 'border-primary/50 glow-primary' : ''}`}>
      <KeyRound className="w-12 h-12 mx-auto mb-3 text-accent" />
      <h3 className="font-mono text-sm text-muted-foreground uppercase tracking-wider mb-2">Secret Code Lock</h3>
      {hint && <p className="text-xs text-muted-foreground mb-4">Hint: {hint}</p>}

      {status === 'correct' ? (
        <p className="font-mono text-primary text-glow text-lg">✓ UNLOCKED</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter secret code..."
            className="bg-muted/50 border-border font-mono text-center"
          />
          {status === 'wrong' && <p className="text-destructive text-sm font-mono">✗ Incorrect code</p>}
          <Button type="submit" className="w-full bg-accent text-accent-foreground font-mono hover:bg-accent/80">
            Verify Code
          </Button>
        </form>
      )}
    </div>
  );
}
