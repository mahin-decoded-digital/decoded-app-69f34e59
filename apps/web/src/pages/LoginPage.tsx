import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/authStore';

export default function LoginPage() {
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('All fields are required.');
      return;
    }
    setLoading(true);
    const result = login(email, password);
    setLoading(false);
    if (result.ok) {
      navigate(from, { replace: true });
    } else {
      setError(result.error ?? 'Login failed.');
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--kanban-bg)' }}>
      {/* Left brand panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 p-10"
        style={{ background: 'var(--sidebar-bg)' }}
      >
        <div>
          <div className="flex items-center gap-3 mb-12">
            <img
              src="https://decoded-studios-storage.s3.ap-southeast-2.amazonaws.com/public/buddy-3548f47a.png"
              alt="DevFlow Central"
              className="h-12 w-auto object-contain"
            />
            <div>
              <div className="text-lg font-bold" style={{ color: 'var(--sidebar-text-active)' }}>DevFlow Central</div>
              <div className="text-sm" style={{ color: 'var(--sidebar-text)' }}>Project Intelligence Platform</div>
            </div>
          </div>
          <div className="space-y-6">
            {[
              { icon: '⚡', title: 'Sprint Velocity Tracking', desc: 'Measure and predict team throughput with burn-down analytics.' },
              { icon: '🔗', title: 'Git Integration', desc: 'Link commits and PRs directly to tasks. Auto-close on merge.' },
              { icon: '⏱', title: 'Time Tracking', desc: 'Log billable hours against tickets for accurate project billing.' },
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-3">
                <span className="text-xl flex-shrink-0 mt-0.5">{f.icon}</span>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--sidebar-text-active)' }}>{f.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--sidebar-text)' }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs" style={{ color: 'var(--sidebar-text)' }}>
          © {new Date().getFullYear()} DevFlow Central. Built for modern software teams.
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex justify-center mb-8">
            <img
              src="https://decoded-studios-storage.s3.ap-southeast-2.amazonaws.com/public/buddy-3548f47a.png"
              alt="DevFlow Central"
              className="h-12 w-auto object-contain"
            />
          </div>

          <div className="bg-background rounded-xl border border-border p-8 shadow-sm">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Sign in to your DevFlow workspace
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Work Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="mt-1"
                  autoComplete="email"
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  className="mt-1"
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <p className="text-sm text-destructive bg-destructive/10 rounded px-3 py-2">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>

            <p className="mt-5 text-center text-sm text-muted-foreground">
              New to DevFlow?{' '}
              <Link to="/signup" className="text-primary font-medium hover:underline">
                Create a workspace
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
