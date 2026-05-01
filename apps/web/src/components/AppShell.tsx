import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function AppShell() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto" style={{ background: 'var(--surface-paper)' }}>
        <Outlet />
      </main>
    </div>
  );
}
