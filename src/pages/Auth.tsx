import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, Shield, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password, displayName);
        toast.success('Account created!');
        navigate('/dashboard');
      } else {
        await signIn(email, password);
        navigate('/dashboard');
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-accent/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 mb-4 animate-pulse-glow">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-mono font-bold text-foreground text-glow">
            CryptoLock
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Encrypted messaging with creative locks
          </p>
        </div>

        {/* Form */}
        <div className="glass rounded-2xl p-8">
          <h2 className="text-xl font-mono font-semibold text-foreground mb-6">
            {isSignUp ? '[ CREATE ACCOUNT ]' : '[ ACCESS TERMINAL ]'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Display Name</label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Agent_Name"
                  className="mt-1 bg-muted/50 border-border font-mono"
                  required
                />
              </div>
            )}

            <div>
              <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="agent@crypto.lock"
                className="mt-1 bg-muted/50 border-border font-mono"
                required
              />
            </div>

            <div className="relative">
              <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Password</label>
              <div className="relative mt-1">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-muted/50 border-border font-mono pr-10"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground font-mono font-semibold hover:bg-primary/90 glow-primary"
            >
              <Lock className="w-4 h-4 mr-2" />
              {loading ? 'Processing...' : isSignUp ? 'Initialize Account' : 'Authenticate'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-muted-foreground hover:text-primary font-mono transition-colors"
            >
              {isSignUp ? '> Already have access? Sign in' : '> Need access? Create account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
