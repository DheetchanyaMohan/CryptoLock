import { useState } from 'react';
import { encryptMessage, decryptMessage } from '@/lib/crypto';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ShieldCheck, Lock, Unlock } from 'lucide-react';
import { toast } from 'sonner';

export default function EncryptDecryptTool() {
  const [mode, setMode] = useState<'encrypt' | 'decrypt'>('encrypt');
  const [input, setInput] = useState('');
  const [password, setPassword] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleProcess = async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      const pwd = password || 'cryptolock-default-key';
      if (mode === 'encrypt') {
        const result = await encryptMessage(input, pwd);
        setOutput(result);
        toast.success('Text encrypted!');
      } else {
        const result = await decryptMessage(input, pwd);
        setOutput(result);
        toast.success('Text decrypted!');
      }
    } catch {
      toast.error(mode === 'encrypt' ? 'Encryption failed' : 'Decryption failed — check your key');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass rounded-2xl p-6 space-y-4">
      <h2 className="font-mono text-lg font-semibold flex items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-secondary" />
        Encrypt / Decrypt Tool
      </h2>

      <div className="flex gap-2">
        <Button
          variant={mode === 'encrypt' ? 'default' : 'outline'}
          onClick={() => { setMode('encrypt'); setOutput(''); }}
          className="font-mono flex-1"
        >
          <Lock className="w-4 h-4 mr-1" /> Encrypt
        </Button>
        <Button
          variant={mode === 'decrypt' ? 'default' : 'outline'}
          onClick={() => { setMode('decrypt'); setOutput(''); }}
          className="font-mono flex-1"
        >
          <Unlock className="w-4 h-4 mr-1" /> Decrypt
        </Button>
      </div>

      <div>
        <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
          {mode === 'encrypt' ? 'Plaintext' : 'Ciphertext'}
        </label>
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={mode === 'encrypt' ? 'Enter text to encrypt...' : 'Paste encrypted text...'}
          className="mt-1 bg-muted/50 border-border font-mono min-h-[80px]"
        />
      </div>

      <div>
        <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Encryption Key (optional)</label>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Default key used if empty"
          className="mt-1 bg-muted/50 border-border font-mono"
        />
      </div>

      <Button onClick={handleProcess} disabled={loading || !input.trim()} className="w-full font-mono bg-secondary text-secondary-foreground hover:bg-secondary/80 glow-secondary">
        {loading ? 'Processing...' : mode === 'encrypt' ? 'Encrypt Text' : 'Decrypt Text'}
      </Button>

      {output && (
        <div>
          <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Result</label>
          <Textarea value={output} readOnly className="mt-1 bg-muted/50 border-border font-mono min-h-[80px]" />
          <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(output); toast.success('Copied!'); }} className="mt-1 text-muted-foreground font-mono text-xs">
            Copy to clipboard
          </Button>
        </div>
      )}
    </div>
  );
}
