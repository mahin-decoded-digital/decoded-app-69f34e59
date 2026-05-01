import { useMemo, useEffect } from 'react'
import {Bell, Check, Trash, SplitSquareVertical, Clock, Zap, MessageSquare, User} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/PageHeader';
import { useNotificationStore } from '@/stores/notificationStore';
import { useAuthStore } from '@/stores/authStore';
import type { NotificationType } from '@/types';

const typeIconMap: Record<NotificationType, React.ReactNode> = {
  task_assigned: <User className="h-4 w-4" />,
  status_changed: <Zap className="h-4 w-4" />,
  pr_merged: <SplitSquareVertical className="h-4 w-4" />,
  comment_added: <MessageSquare className="h-4 w-4" />,
  sprint_started: <Zap className="h-4 w-4" />,
  sprint_completed: <Check className="h-4 w-4" />,
};

const typeColorMap: Record<NotificationType, string> = {
  task_assigned: 'var(--brand-blue)',
  status_changed: 'var(--priority-medium)',
  pr_merged: 'var(--pr-merged)',
  comment_added: 'var(--brand-steel)',
  sprint_started: 'var(--status-in-progress)',
  sprint_completed: 'var(--status-done)',
};

export default function NotificationsPage() {
  // === auto fetch-on-mount (backend planner) ===
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);
  // === end auto fetch-on-mount ===

  const notifications = useNotificationStore((s) => s.notifications);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);
  const deleteNotification = useNotificationStore((s) => s.deleteNotification);
  const clearAll = useNotificationStore((s) => s.clearAll);
  const currentUser = useAuthStore((s) => s.currentUser);

  const myNotifications = useMemo(
    () => notifications.filter((n) => n.userId === currentUser?.id),
    [notifications, currentUser?.id]
  );

  const unread = useMemo(() => myNotifications.filter((n) => !n.read).length, [myNotifications]);

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Status changes, PR updates, and sprint alerts."
        actions={
          myNotifications.length > 0 ? (
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => currentUser && markAllAsRead(currentUser.id)}
                >
                  <Check className="h-3.5 w-3.5 mr-1" />
                  Mark all read
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => currentUser && clearAll(currentUser.id)}
              >
                <Trash className="h-3.5 w-3.5 mr-1" />
                Clear all
              </Button>
            </div>
          ) : undefined
        }
      />

      <div className="p-6">
        {myNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Bell className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
            <h2 className="text-base font-semibold mb-2">All clear — no notifications</h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              You'll be notified here when tasks are assigned, PRs are merged, or sprint statuses change.
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-w-2xl">
            {unread > 0 && (
              <p className="text-xs text-muted-foreground mb-3">
                {unread} unread notification{unread !== 1 ? 's' : ''}
              </p>
            )}
            {myNotifications.map((notif) => (
              <div
                key={notif.id}
                className={`flex items-start gap-3 p-4 rounded-lg border transition-colors ${
                  notif.read ? 'border-border bg-background' : 'border-primary/20 bg-primary/5'
                }`}
              >
                {/* Icon */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{
                    background: `${typeColorMap[notif.type]}18`,
                    color: typeColorMap[notif.type],
                  }}
                >
                  {typeIconMap[notif.type]}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium">{notif.title}</p>
                    {!notif.read && (
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0 mt-1"
                        style={{ background: 'var(--brand-blue)' }}
                      />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{notif.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(notif.createdAt).toLocaleDateString('en', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {!notif.read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => markAsRead(notif.id)}
                      title="Mark as read"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteNotification(notif.id)}
                    title="Delete"
                  >
                    <Trash className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}