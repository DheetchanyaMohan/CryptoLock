import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/localDB';
import { encryptMessage } from '@/lib/crypto';
import { encodeMessageInImage } from '@/lib/steganography';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Send, Lock, Clock, Palette, KeyRound, Calculator, Search, X, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface Profile {
  user_id: string;
  display_name: string | null;
}

const LOCK_TYPES = [
  { id: 'time_lock', label: 'Time Lock', icon: Clock, color: 'text-primary' },
  { id: 'color_sequence', label: 'Color Sequence', icon: Palette, color: 'text-secondary' },
  { id: 'secret_code', label: 'Secret Code', icon: KeyRound, color: 'text-accent' },
  { id: 'math_quiz', label: 'Math Quiz', icon: Calculator, color: 'text-secondary' },
  { id: 'steganography', label: 'Hidden Word', icon: Search, color: 'text-primary' },
] as const;

// Downscale a blob to keep base64 payload under localStorage quota.
async function blobToDataUrl(blob: Blob, maxEdge = 800): Promise<string> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const i = new Image();
    i.onload = () => { URL.revokeObjectURL(url); resolve(i); };
    i.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    i.src = url;
  });
  const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL('image/png');
}

export default function SendMessage({ onSent }: { onSent?: () => void }) {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [lockType, setLockType] = useState<string>('time_lock');
  const [recipients, setRecipients] = useState<string[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [sending, setSending] = useState(false);

  // Lock config states
  const [unlockDate, setUnlockDate] = useState('');
  const [colorSequence, setColorSequence] = useState<string[]>([]);
  const [secretCode, setSecretCode] = useState('');
  const [secretHint, setSecretHint] = useState('');
  const [mathQuestion, setMathQuestion] = useState('');
  const [mathAnswer, setMathAnswer] = useState('');
  const [stegoImage, setStegoImage] = useState<File | null>(null);
  const [stegoImagePreview, setStegoImagePreview] = useState('');
  const [hiddenWord, setHiddenWord] = useState('');
  const [stegoHint, setStegoHint] = useState('');

  useEffect(() => {
    if (!user) return;
    try {
      const all = db.profiles.select(p => p.user_id !== user.id);
      setProfiles(all.map(p => ({ user_id: p.user_id, display_name: p.display_name })));
    } catch (err) {
      console.warn('[SendMessage] failed to load profiles', err);
      setProfiles([]);
    }
  }, [user]);

  const addColor = (color: string) => {
    setColorSequence(prev => [...prev, color]);
  };

  const buildLockConfig = () => {
    switch (lockType) {
      case 'time_lock': return { unlock_date: unlockDate };
      case 'color_sequence': return { sequence: colorSequence };
      case 'secret_code': return { code: secretCode, hint: secretHint };
      case 'math_quiz': return { question: mathQuestion, answer: parseFloat(mathAnswer) };
      case 'steganography': return { hidden_word: hiddenWord, hint: stegoHint, image_url: '' };
      default: return {};
    }
  };

  const handleSend = async () => {
    if (!user || !message.trim() || recipients.length === 0) {
      toast.error('Please fill in all fields and select recipients');
      return;
    }

    setSending(true);
    try {
      let stegoImageUrl = '';

      if (lockType === 'steganography') {
        if (!stegoImage || !hiddenWord.trim()) {
          toast.error('Please select an image and enter a hidden word');
          setSending(false);
          return;
        }
        const encodedBlob = await encodeMessageInImage(stegoImage, hiddenWord.trim());
        // Store as base64 data URL inline (no cloud bucket needed)
        stegoImageUrl = await blobToDataUrl(encodedBlob, 800);
      }

      const lockConfig: any = buildLockConfig();
      if (lockType === 'steganography') {
        lockConfig.image_url = stegoImageUrl;
      }

      const encrypted = await encryptMessage(message);
      const now = new Date().toISOString();
      const msg = db.messages.insert({
        sender_id: user.id,
        content: encrypted,
        lock_type: lockType,
        lock_config: lockConfig,
        is_encrypted: true,
        created_at: now,
        updated_at: now,
      });
      if (!msg) throw new Error('Storage full — try smaller image or clear old messages');

      for (const rid of recipients) {
        db.recipients.insert({
          message_id: msg.id,
          recipient_id: rid,
          is_unlocked: false,
          unlocked_at: null,
          created_at: now,
        });
      }

      toast.success('Message sent & encrypted!');
      setMessage('');
      setRecipients([]);
      setColorSequence([]);
      setStegoImage(null);
      setStegoImagePreview('');
      setHiddenWord('');
      onSent?.();
    } catch (err: any) {
      console.warn('[SendMessage] send failed', err);
      toast.error(err?.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="glass rounded-2xl p-6 space-y-5">
      <h2 className="font-mono text-lg font-semibold flex items-center gap-2">
        <Send className="w-5 h-5 text-primary" />
        Send Encrypted Message
      </h2>

      {/* Message */}
      <div>
        <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Message</label>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your secret message..."
          className="mt-1 bg-muted/50 border-border font-mono min-h-[100px]"
        />
      </div>

      {/* Recipients */}
      <div>
        <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Recipients</label>
        <div className="flex flex-wrap gap-2 mt-2">
          {profiles.map(p => (
            <button
              key={p.user_id}
              onClick={() => setRecipients(prev =>
                prev.includes(p.user_id) ? prev.filter(id => id !== p.user_id) : [...prev, p.user_id]
              )}
              className={`px-3 py-1.5 rounded-lg text-sm font-mono transition-all ${
                recipients.includes(p.user_id)
                  ? 'bg-primary/20 text-primary border border-primary/50'
                  : 'bg-muted text-muted-foreground border border-border hover:border-primary/30'
              }`}
            >
              {p.display_name || 'Unknown'}
            </button>
          ))}
          {profiles.length === 0 && (
            <p className="text-sm text-muted-foreground font-mono">No other users yet. Sign out and create another account in this browser to send messages.</p>
          )}
        </div>
      </div>

      {/* Lock Type */}
      <div>
        <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Lock Type</label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {LOCK_TYPES.map(lt => (
            <button
              key={lt.id}
              onClick={() => setLockType(lt.id)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-mono transition-all ${
                lockType === lt.id
                  ? 'bg-primary/10 border border-primary/50 text-primary'
                  : 'bg-muted border border-border text-muted-foreground hover:border-primary/30'
              }`}
            >
              <lt.icon className={`w-4 h-4 ${lt.color}`} />
              {lt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lock Config */}
      <div className="space-y-3">
        {lockType === 'time_lock' && (
          <div>
            <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Unlock Date & Time</label>
            <Input
              type="datetime-local"
              value={unlockDate}
              onChange={(e) => setUnlockDate(e.target.value)}
              className="mt-1 bg-muted/50 border-border font-mono"
            />
          </div>
        )}

        {lockType === 'color_sequence' && (
          <div>
            <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Set Color Sequence</label>
            <div className="flex gap-3 mt-2">
              {['red', 'yellow', 'green'].map(color => (
                <button
                  key={color}
                  onClick={() => addColor(color)}
                  className={`w-12 h-12 rounded-full transition-all active:scale-90 ${
                    color === 'red' ? 'bg-red-500 hover:bg-red-400' :
                    color === 'yellow' ? 'bg-yellow-500 hover:bg-yellow-400' :
                    'bg-green-500 hover:bg-green-400'
                  }`}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs font-mono text-muted-foreground">Sequence:</span>
              {colorSequence.map((c, i) => (
                <span key={i} className={`w-4 h-4 rounded-full inline-block ${
                  c === 'red' ? 'bg-red-500' : c === 'yellow' ? 'bg-yellow-500' : 'bg-green-500'
                }`} />
              ))}
              {colorSequence.length > 0 && (
                <button onClick={() => setColorSequence([])} className="text-muted-foreground hover:text-foreground">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        )}

        {lockType === 'secret_code' && (
          <>
            <div>
              <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Secret Code</label>
              <Input value={secretCode} onChange={(e) => setSecretCode(e.target.value)} placeholder="Enter secret code..." className="mt-1 bg-muted/50 border-border font-mono" />
            </div>
            <div>
              <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Hint (optional)</label>
              <Input value={secretHint} onChange={(e) => setSecretHint(e.target.value)} placeholder="A helpful hint..." className="mt-1 bg-muted/50 border-border font-mono" />
            </div>
          </>
        )}

        {lockType === 'math_quiz' && (
          <>
            <div>
              <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Math Question</label>
              <Input value={mathQuestion} onChange={(e) => setMathQuestion(e.target.value)} placeholder="e.g. What is 15 × 7 + 3?" className="mt-1 bg-muted/50 border-border font-mono" />
            </div>
            <div>
              <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Correct Answer</label>
              <Input type="number" value={mathAnswer} onChange={(e) => setMathAnswer(e.target.value)} placeholder="Answer..." className="mt-1 bg-muted/50 border-border font-mono" />
            </div>
          </>
        )}

        {lockType === 'steganography' && (
          <>
            <div>
              <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Upload Cover Image</label>
              <div className="mt-2">
                {stegoImagePreview ? (
                  <div className="relative rounded-lg overflow-hidden border border-border">
                    <img src={stegoImagePreview} alt="Cover" className="w-full max-h-48 object-contain bg-muted" />
                    <button
                      onClick={() => { setStegoImage(null); setStegoImagePreview(''); }}
                      className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm rounded-full p-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center gap-2 p-6 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                    <ImageIcon className="w-8 h-8 text-muted-foreground" />
                    <span className="text-xs font-mono text-muted-foreground">Click to select an image</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setStegoImage(file);
                          setStegoImagePreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </label>
                )}
              </div>
            </div>
            <div>
              <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Hidden Word (encoded in pixels)</label>
              <Input value={hiddenWord} onChange={(e) => setHiddenWord(e.target.value)} placeholder="Secret word to hide in the image..." className="mt-1 bg-muted/50 border-border font-mono" />
            </div>
            <div>
              <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Hint (optional)</label>
              <Input value={stegoHint} onChange={(e) => setStegoHint(e.target.value)} placeholder="A clue to help find the word..." className="mt-1 bg-muted/50 border-border font-mono" />
            </div>
          </>
        )}
      </div>

      <Button
        onClick={handleSend}
        disabled={sending || !message.trim() || recipients.length === 0}
        className="w-full bg-primary text-primary-foreground font-mono font-semibold hover:bg-primary/90 glow-primary"
      >
        <Lock className="w-4 h-4 mr-2" />
        {sending ? 'Encrypting & Sending...' : 'Encrypt & Send'}
      </Button>
    </div>
  );
}
