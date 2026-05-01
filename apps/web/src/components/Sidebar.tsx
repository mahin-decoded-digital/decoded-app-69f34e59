import { NavLink, useNavigate } from 'react-router-dom';
import {LayoutDashboard, Ban, Zap, AlignRight, Clock, Bell, Settings, LogOut, ChevronDown, Plus, FolderOpen} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { useProjectStore } from '@/stores/projectStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { Avatar } from '@/components/ui/avatar';
import { useState, useMemo } from 'react';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/kanban', icon: Ban, label: 'Ban Board' },
  { to: '/sprints', icon: Zap, label: 'Sprint Planning' },
  { to: '/integrations', icon: AlignRight, label: 'Git Integration' },
  { to: '/time-tracking', icon: Clock, label: 'Time Tracking' },
  { to: '/notifications', icon: Bell, label: 'Notifications', badge: true },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const logout = useAuthStore((s) => s.logout);
  const projects = useProjectStore((s) => s.projects);
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const setActiveProject = useProjectStore((s) => s.setActiveProject);
  const notifications = useNotificationStore((s) => s.notifications);
  const navigate = useNavigate();
  const [projectsOpen, setProjectsOpen] = useState(true);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read && n.userId === currentUser?.id).length,
    [notifications, currentUser?.id]
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      className="flex flex-col h-screen w-60 flex-shrink-0 select-none"
      style={{ background: 'var(--sidebar-bg)', borderRight: '1px solid var(--sidebar-border)' }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-4 py-4 border-b"
        style={{ borderColor: 'var(--sidebar-border)', background: 'var(--sidebar-logo-bg)' }}
      >
        <img
          src="https://decoded-studios-storage.s3.ap-southeast-2.amazonaws.com/public/buddy-3548f47a.png"
          alt="DevFlow Central"
          className="h-8 w-auto object-contain flex-shrink-0"
        />
        <div>
          <div className="text-sm font-bold leading-tight" style={{ color: 'var(--sidebar-text-active)' }}>
            DevFlow
          </div>
          <div className="text-xs" style={{ color: 'var(--sidebar-text)' }}>
            Central
          </div>
        </div>
      </div>

      {/* Projects Section */}
      <div className="px-3 pt-4 pb-2">
        <button
          type="button"
          onClick={() => setProjectsOpen((o) => !o)}
          className="w-full flex items-center justify-between px-2 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-colors"
          style={{ color: 'var(--sidebar-text)' }}
        >
          <div className="flex items-center gap-2">
            <FolderOpen className="h-3.5 w-3.5" />
            Projects
          </div>
          <ChevronDown
            className={cn('h-3.5 w-3.5 transition-transform', projectsOpen && 'rotate-180')}
          />
        </button>

        {projectsOpen && (
          <div className="mt-1 space-y-0.5">
            {projects.length === 0 ? (
              <p className="px-2 py-1 text-xs" style={{ color: 'var(--sidebar-text)' }}>
                No projects yet
              </p>
            ) : (
              projects.map((proj) => (
                <button
                  key={proj.id}
                  type="button"
                  onClick={() => setActiveProject(proj.id)}
                  className={cn(
                    'w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs font-medium transition-colors truncate',
                    activeProjectId === proj.id
                      ? 'text-[var(--sidebar-text-active)] bg-[var(--sidebar-active)]'
                      : 'text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-text-active)]'
                  )}
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: proj.color }}
                  />
                  <span className="truncate">{proj.name}</span>
                </button>
              ))
            )}
            <button
              type="button"
              onClick={() => navigate('/settings?tab=projects')}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors"
              style={{ color: 'var(--sidebar-text)' }}
            >
              <Plus className="h-3.5 w-3.5" />
              New project
            </button>
          </div>
        )}
      </div>

      <div className="px-3 my-2">
        <div className="h-px" style={{ background: 'var(--sidebar-border)' }} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label, badge }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors w-full',
                isActive
                  ? 'bg-[var(--sidebar-active)] text-[var(--sidebar-text-active)]'
                  : 'text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-text-active)]'
              )
            }
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            <span className="flex-1">{label}</span>
            {badge && unreadCount > 0 && (
              <span className="bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div
        className="p-3 border-t"
        style={{ borderColor: 'var(--sidebar-border)' }}
      >
        <div className="flex items-center gap-3 px-2 py-1.5">
          <Avatar initials={currentUser?.avatarInitials ?? '??'} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate" style={{ color: 'var(--sidebar-text-active)' }}>
              {currentUser?.name}
            </p>
            <p className="text-xs truncate capitalize" style={{ color: 'var(--sidebar-text)' }}>
              {currentUser?.role}
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="p-1 rounded transition-colors"
            style={{ color: 'var(--sidebar-text)' }}
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
