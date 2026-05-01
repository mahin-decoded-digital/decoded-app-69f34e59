import { create } from 'zustand';
import { apiUrl } from '@/lib/api';
import type { Notification, NotificationType } from '@/types';

interface NotificationState {
  notifications: Notification[];
  loading: boolean;
  error: string | null;
  loaded: boolean;
  fetchNotifications: () => Promise<void>;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: (userId: string) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAll: (userId: string) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>()(
  (set, get) => ({
    notifications: [],
    loading: false,
    error: null,
    loaded: false,

    fetchNotifications: async () => {
      if (get().loading || get().loaded) return;
      set({ loading: true, error: null });
      try {
        const res = await fetch(apiUrl('/api/notifications'));
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const items = await res.json();
        set({ notifications: items, loading: false, loaded: true });
      } catch (err) {
        set({ loading: false, error: err instanceof Error ? err.message : 'Failed to load' });
      }
    },

    addNotification: async (notifData) => {
      try {
        const res = await fetch(apiUrl('/api/notifications'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(notifData),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const created: Notification = await res.json();
        set((state) => ({
          notifications: [created, ...state.notifications].slice(0, 100),
        }));
      } catch (err) {
        set({ error: err instanceof Error ? err.message : 'Failed to add notification' });
      }
    },

    markAsRead: async (id) => {
      try {
        const res = await fetch(apiUrl(`/api/notifications/${id}`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ read: true }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const updated: Notification = await res.json();
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? updated : n
          ),
        }));
      } catch (err) {
        set({ error: err instanceof Error ? err.message : 'Failed to mark as read' });
      }
    },

    markAllAsRead: async (userId) => {
      try {
        const userNotifications = get().notifications.filter((n) => n.userId === userId && !n.read);
        const results = await Promise.all(
          userNotifications.map((n) =>
            fetch(apiUrl(`/api/notifications/${n.id}`), {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ read: true }),
            }).then(async (res) => {
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
              return res.json() as Promise<Notification>;
            })
          )
        );
        const updatedMap = new Map(results.map((n) => [n.id, n]));
        set((state) => ({
          notifications: state.notifications.map((n) =>
            updatedMap.has(n.id) ? updatedMap.get(n.id)! : n
          ),
        }));
      } catch (err) {
        set({ error: err instanceof Error ? err.message : 'Failed to mark all as read' });
      }
    },

    deleteNotification: async (id) => {
      try {
        const res = await fetch(apiUrl(`/api/notifications/${id}`), {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      } catch (err) {
        set({ error: err instanceof Error ? err.message : 'Failed to delete notification' });
      }
    },

    clearAll: async (userId) => {
      try {
        const userNotifications = get().notifications.filter((n) => n.userId === userId);
        await Promise.all(
          userNotifications.map((n) =>
            fetch(apiUrl(`/api/notifications/${n.id}`), {
              method: 'DELETE',
            }).then(async (res) => {
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
            })
          )
        );
        set((state) => ({
          notifications: state.notifications.filter((n) => n.userId !== userId),
        }));
      } catch (err) {
        set({ error: err instanceof Error ? err.message : 'Failed to clear notifications' });
      }
    },
  })
);