import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { useAuthStore } from '@/stores/authStore';
import type { UserRole } from '@/types';

const roleOptions = [
  { value: 'developer', label: 'Developer' },
  { value: 'pm', label: 'Project Manager' },
  { value: 'admin', label: 'Admin' },
  { value: 'stakeholder', label: 'Stakeholder' },
];

export default function SignupPage() {
  const register = useAuthStore((s) => s.register);
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('developer');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Name is required.';
    if (!email) e.email = 'Email is required.';
    if (!password) e.password = 'Password is required.';
    if (password.length < 8) e.password = 'Password must be at least 8 characters.';
    if (password !== confirmPassword) e.confirmPassword = 'Passwords do not match.';
    return e;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);
    const result = register(email, password, name, role);
    setLoading(false);
    if (result.ok) {
      navigate('/dashboard');
    } else {
      setErrors({ email: result.error ?? 'Registration failed.' });
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
          <blockquote className="border-l-2 border-primary pl-4 mt-8">
            <p className="text-sm italic" style={{ color: 'var(--sidebar-text-active)' }}>
              "The single source of truth for the modern software factory."
            </p>
          </blockquote>
          <div className="mt-8 space-y-3">
            {['Kanban boards + sprint planning', 'GitHub & GitLab PR tracking', 'Role-based permissions', 'Built-in time tracking'].map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm" style={{ color: 'var(--sidebar-text)' }}>
                <span className="text-primary">✓</span> {f}
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs" style={{ color: 'var(--sidebar-text)' }}>
          © {new Date().getFullYear()} DevFlow Central
        </p>
      </div>

      {/* Right form */}
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
              <h1 className="text-2xl font-bold text-foreground">Create your workspace</h1>
              <p className="mt-1 text-sm text-muted-foreground">Set up your team's DevFlow account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Johnson"
                  className="mt-1"
                  autoComplete="name"
                />
                {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
              </div>

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
                {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
              </div>

              <div>
                <Label className="mb-1 block">Role</Label>
                <Select
                  value={role}
                  onChange={(v) => setRole(v as UserRole)}
                  options={roleOptions}
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className="mt-1"
                  autoComplete="new-password"
                />
                {errors.password && <p className="text-xs text-destructive mt-1">{errors.password}</p>}
              </div>

              <div>
                <Label htmlFor="confirm">Confirm Password</Label>
                <Input
                  id="confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  className="mt-1"
                  autoComplete="new-password"
                />
                {errors.confirmPassword && <p className="text-xs text-destructive mt-1">{errors.confirmPassword}</p>}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating workspace…' : 'Create workspace'}
              </Button>
            </form>

            <p className="mt-5 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-primary font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
