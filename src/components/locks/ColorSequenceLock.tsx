import { useState } from 'react';
import { Palette, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ColorSequenceLockProps {
  sequence: string[];
  onUnlock: () => void;
}

const COLOR_MAP: Record<string, string> = {
  red: 'bg-red-500 hover:bg-red-400 shadow-red-500/30',
  yellow: 'bg-yellow-500 hover:bg-yellow-400 shadow-yellow-500/30',
  green: 'bg-green-500 hover:bg-green-400 shadow-green-500/30',
};

export default function ColorSequenceLock({ sequence, onUnlock }: ColorSequenceLockProps) {
  const [userSequence, setUserSequence] = useState<string[]>([]);
  const [status, setStatus] = useState<'idle' | 'wrong' | 'correct'>('idle');

  const handleColorClick = (color: string) => {
    if (status === 'correct') return;
    const newSeq = [...userSequence, color];
    setUserSequence(newSeq);

    if (newSeq.length === sequence.length) {
      const matches = newSeq.every((c, i) => c === sequence[i]);
      if (matches) {
        setStatus('correct');
        onUnlock();
      } else {
        setStatus('wrong');
        setTimeout(() => {
          setUserSequence([]);
          setStatus('idle');
        }, 1000);
      }
    }
  };

  const reset = () => {
    setUserSequence([]);
    setStatus('idle');
  };

  return (
    <div className={`glass rounded-xl p-6 text-center ${status === 'correct' ? 'border-primary/50 glow-primary' : status === 'wrong' ? 'border-destructive/50' : ''}`}>
      <Palette className="w-12 h-12 mx-auto mb-3 text-secondary" />
      <h3 className="font-mono text-sm text-muted-foreground uppercase tracking-wider mb-4">Color Sequence Lock</h3>

      {/* Progress dots */}
      <div className="flex justify-center gap-2 mb-4">
        {sequence.map((_, i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full border-2 transition-all ${
              i < userSequence.length
                ? userSequence[i] === 'red' ? 'bg-red-500 border-red-500'
                : userSequence[i] === 'yellow' ? 'bg-yellow-500 border-yellow-500'
                : 'bg-green-500 border-green-500'
                : 'border-muted-foreground/30'
            }`}
          />
        ))}
      </div>

      {status === 'correct' ? (
        <p className="font-mono text-primary text-glow text-lg">✓ UNLOCKED</p>
      ) : (
        <>
          <div className="flex justify-center gap-4 mb-4">
            {['red', 'yellow', 'green'].map(color => (
              <button
                key={color}
                onClick={() => handleColorClick(color)}
                className={`w-16 h-16 rounded-full ${COLOR_MAP[color]} shadow-lg transition-all active:scale-90`}
              />
            ))}
          </div>
          {status === 'wrong' && (
            <p className="font-mono text-destructive text-sm mb-2">✗ Wrong sequence!</p>
          )}
          <Button variant="ghost" size="sm" onClick={reset} className="text-muted-foreground font-mono">
            <RotateCcw className="w-3 h-3 mr-1" /> Reset
          </Button>
        </>
      )}
    </div>
  );
}
