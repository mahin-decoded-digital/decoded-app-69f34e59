import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--kanban-bg)' }}>
      <div className="text-center max-w-md px-6">
        <p className="text-7xl font-bold font-mono text-muted-foreground/30 mb-4">404</p>
        <h1 className="text-xl font-semibold text-foreground mb-2">Route not found in the pipeline</h1>
        <p className="text-sm text-muted-foreground mb-6">
          This page doesn't exist in DevFlow Central. It may have been moved, deleted, or the URL is incorrect.
        </p>
        <Link to="/dashboard">
          <Button>
            <Home className="h-4 w-4 mr-2" />
            Back to dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
