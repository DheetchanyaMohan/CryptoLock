import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Eye, Loader2 } from 'lucide-react';
import { decodeMessageFromImage } from '@/lib/steganography';

interface SteganographyLockProps {
  imageUrl: string;
  hint?: string;
  onUnlock: () => void;
}

export default function SteganographyLock({ imageUrl, hint, onUnlock }: SteganographyLockProps) {
  const [guess, setGuess] = useState('');
  const [error, setError] = useState('');
  const [decoding, setDecoding] = useState(false);

  const handleSubmit = async () => {
    if (!guess.trim()) return;
    setDecoding(true);
    setError('');

    try {
      const hiddenWord = await decodeMessageFromImage(imageUrl);
      if (guess.trim().toLowerCase() === hiddenWord.trim().toLowerCase()) {
        onUnlock();
      } else {
        setError('Wrong word! The secret is hidden in the image pixels...');
        setTimeout(() => setError(''), 3000);
      }
    } catch {
      setError('Failed to decode image. Try again.');
    } finally {
      setDecoding(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="bg-muted/50 rounded-lg p-4 space-y-3">
        <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Search className="w-3 h-3" />
          Steganography Challenge
        </span>
        <p className="text-xs text-muted-foreground font-mono">
          A secret word is hidden inside this image using steganography. Can you find it?
        </p>
        <div className="relative rounded-lg overflow-hidden border border-border">
          <img
            src={imageUrl}
            alt="Steganography image"
            className="w-full max-h-64 object-contain bg-background"
          />
          <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm rounded-md px-2 py-1 flex items-center gap-1">
            <Eye className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-mono text-primary">LSB ENCODED</span>
          </div>
        </div>
        {hint && (
          <p className="text-xs text-accent font-mono">💡 Hint: {hint}</p>
        )}
      </div>
      <div className="flex gap-2">
        <Input
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="What word is hidden in the image?"
          className="bg-muted/50 border-border font-mono text-sm"
        />
        <Button
          onClick={handleSubmit}
          disabled={decoding}
          size="sm"
          className="bg-primary text-primary-foreground font-mono shrink-0"
        >
          {decoding ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Decode'}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive font-mono animate-pulse">{error}</p>}
    </div>
  );
}
