import { useState, useCallback } from 'react';
import { db } from '@/lib/localDB';
import { decryptMessage } from '@/lib/crypto';
import { Lock, Unlock, Clock, Palette, KeyRound, Calculator, Search, User } from 'lucide-react';
import TimeLock from '@/components/locks/TimeLock';
import ColorSequenceLock from '@/components/locks/ColorSequenceLock';
import SecretCodeLock from '@/components/locks/SecretCodeLock';
import MathQuizLock from '@/components/locks/MathQuizLock';
import SteganographyLock from '@/components/locks/SteganographyLock';

interface MessageCardProps {
  message: {
    id: string;
    content: string;
    lock_type: string;
    lock_config: any;
    is_encrypted: boolean;
    created_at: string;
    sender_id: string;
  };
  recipientEntry?: {
    id: string;
    is_unlocked: boolean;
  };
  senderName?: string;
  isOwnMessage?: boolean;
}

const LOCK_ICONS: Record<string, typeof Clock> = {
  time_lock: Clock,
  color_sequence: Palette,
  secret_code: KeyRound,
  math_quiz: Calculator,
  steganography: Search,
};

const LOCK_COLORS: Record<string, string> = {
  time_lock: 'text-primary',
  color_sequence: 'text-secondary',
  secret_code: 'text-accent',
  math_quiz: 'text-secondary',
  steganography: 'text-primary',
};

export default function MessageCard({ message, recipientEntry, senderName, isOwnMessage }: MessageCardProps) {
  const [decryptedContent, setDecryptedContent] = useState<string | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(recipientEntry?.is_unlocked ?? false);
  const [showLock, setShowLock] = useState(!isUnlocked);

  const LockIcon = LOCK_ICONS[message.lock_type] || Lock;

  const handleUnlock = useCallback(async () => {
    setIsUnlocked(true);
    setShowLock(false);

    if (recipientEntry) {
      try {
        db.recipients.update(recipientEntry.id, {
          is_unlocked: true,
          unlocked_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('[MessageCard] failed to mark unlocked', err);
      }
    }

    try {
      const decrypted = await decryptMessage(message.content);
      setDecryptedContent(decrypted);
    } catch {
      setDecryptedContent('[Decryption failed]');
    }
  }, [message.content, recipientEntry]);

  const renderLock = () => {
    const config = message.lock_config || {};
    switch (message.lock_type) {
      case 'time_lock':
        return <TimeLock unlockDate={config.unlock_date} onUnlock={handleUnlock} />;
      case 'color_sequence':
        return <ColorSequenceLock sequence={config.sequence || []} onUnlock={handleUnlock} />;
      case 'secret_code':
        return <SecretCodeLock code={config.code || ''} hint={config.hint} onUnlock={handleUnlock} />;
      case 'math_quiz':
        return <MathQuizLock question={config.question || ''} answer={config.answer || 0} onUnlock={handleUnlock} />;
      case 'steganography':
        return <SteganographyLock imageUrl={config.image_url || ''} hint={config.hint} onUnlock={handleUnlock} />;
      default:
        return null;
    }
  };

  return (
    <div className={`glass rounded-2xl p-5 transition-all ${isUnlocked ? 'border-primary/30' : 'border-border/50'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <User className="w-4 h-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-mono font-medium">{senderName || 'Unknown'}</p>
            <p className="text-xs text-muted-foreground">{new Date(message.created_at).toLocaleString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <LockIcon className={`w-4 h-4 ${LOCK_COLORS[message.lock_type]}`} />
          {isUnlocked ? (
            <Unlock className="w-4 h-4 text-primary" />
          ) : (
            <Lock className="w-4 h-4 text-destructive" />
          )}
        </div>
      </div>

      {/* Lock or Content */}
      {isOwnMessage ? (
        <div className="bg-muted/50 rounded-lg p-4">
          <p className="font-mono text-sm text-muted-foreground break-all">
            [Encrypted: {message.content.substring(0, 40)}...]
          </p>
          <p className="text-xs text-muted-foreground mt-1 capitalize">
            Lock: {message.lock_type.replace('_', ' ')}
          </p>
        </div>
      ) : showLock ? (
        renderLock()
      ) : (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <p className="font-mono text-sm text-foreground whitespace-pre-wrap">
            {decryptedContent || 'Decrypting...'}
          </p>
        </div>
      )}
    </div>
  );
}
