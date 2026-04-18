import { useState } from 'react';
import { Calculator } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface MathQuizLockProps {
  question: string;
  answer: number;
  onUnlock: () => void;
}

export default function MathQuizLock({ question, answer, onUnlock }: MathQuizLockProps) {
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'wrong' | 'correct'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parseFloat(input) === answer) {
      setStatus('correct');
      onUnlock();
    } else {
      setStatus('wrong');
      setTimeout(() => setStatus('idle'), 1500);
    }
  };

  return (
    <div className={`glass rounded-xl p-6 text-center ${status === 'correct' ? 'border-primary/50 glow-primary' : ''}`}>
      <Calculator className="w-12 h-12 mx-auto mb-3 text-secondary" />
      <h3 className="font-mono text-sm text-muted-foreground uppercase tracking-wider mb-2">Math Quiz Lock</h3>
      <p className="font-mono text-xl text-foreground mb-4">{question}</p>

      {status === 'correct' ? (
        <p className="font-mono text-primary text-glow text-lg">✓ UNLOCKED</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            type="number"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Your answer..."
            className="bg-muted/50 border-border font-mono text-center text-lg"
          />
          {status === 'wrong' && <p className="text-destructive text-sm font-mono">✗ Wrong answer</p>}
          <Button type="submit" className="w-full bg-secondary text-secondary-foreground font-mono hover:bg-secondary/80">
            Submit Answer
          </Button>
        </form>
      )}
    </div>
  );
}
