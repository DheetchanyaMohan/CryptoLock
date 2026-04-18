import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Shield, Lock, Clock, Palette, KeyRound, Calculator, ArrowRight } from 'lucide-react';
import { useEffect } from 'react';

const features = [
  { icon: Clock, title: 'Time Lock', desc: 'Messages unlock at a specific date & time', color: 'text-primary' },
  { icon: Palette, title: 'Color Sequence', desc: 'Click the right color pattern to unlock', color: 'text-secondary' },
  { icon: KeyRound, title: 'Secret Code', desc: 'Enter the passphrase to reveal the message', color: 'text-accent' },
  { icon: Calculator, title: 'Math Quiz', desc: 'Solve the math problem to decrypt', color: 'text-secondary' },
];

export default function Index() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) navigate('/dashboard');
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-1/4 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10">
        {/* Hero */}
        <div className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 border border-primary/30 mb-6 animate-pulse-glow">
            <Shield className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl md:text-6xl font-mono font-bold text-foreground text-glow mb-4">
            CryptoLock
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
            Send encrypted messages with creative lock mechanisms. Time locks, color sequences, secret codes, and math puzzles protect your secrets.
          </p>
          <Button
            onClick={() => navigate('/auth')}
            className="bg-primary text-primary-foreground font-mono font-semibold text-lg px-8 py-6 hover:bg-primary/90 glow-primary"
          >
            <Lock className="w-5 h-5 mr-2" />
            Get Started
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>

        {/* Features */}
        <div className="max-w-4xl mx-auto px-6 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map(f => (
              <div key={f.title} className="glass rounded-2xl p-6 hover:border-primary/30 transition-all group">
                <f.icon className={`w-8 h-8 ${f.color} mb-3 group-hover:scale-110 transition-transform`} />
                <h3 className="font-mono font-semibold text-foreground mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
