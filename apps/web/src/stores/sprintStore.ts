import { create } from 'zustand';
import { apiUrl } from '@/lib/api';
import type { Sprint } from '@/types';

interface SprintState {
  sprints: Sprint[];
  activeSprintId: string | null;
  loading: boolean;
  error: string | null;
  loaded: boolean;
  fetchSprints: () => Promise<void>;
  addSprint: (sprint: Omit<Sprint, 'id' | 'createdAt'>) => Promise<Sprint>;
  updateSprint: (id: string, updates: Partial<Sprint>) => Promise<void>;
  deleteSprint: (id: string) => Promise<void>;
  setActiveSprint: (id: string | null) => void;
  startSprint: (id: string) => Promise<void>;
  completeSprint: (id: string) => Promise<void>;
}

export const useSprintStore = create<SprintState>()(
  (set, get) => ({
    sprints: [],
    activeSprintId: null,
    loading: false,
    error: null,
    loaded: false,

    fetchSprints: async () => {
      if (get().loading || get().loaded) return;
      set({ loading: true, error: null });
      try {
        const res = await fetch(apiUrl('/api/sprints'));
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const items = await res.json();
        set({ sprints: items, loading: false, loaded: true });
      } catch (err) {
        set({ loading: false, error: err instanceof Error ? err.message : 'Failed to load' });
      }
    },

    addSprint: async (sprintData) => {
      const res = await fetch(apiUrl('/api/sprints'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sprintData),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const newSprint: Sprint = await res.json();
      set((state) => ({ sprints: [...state.sprints, newSprint] }));
      return newSprint;
    },

    updateSprint: async (id, updates) => {
      const res = await fetch(apiUrl(`/api/sprints/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated: Sprint = await res.json();
      set((state) => ({
        sprints: state.sprints.map((s) => (s.id === id ? updated : s)),
      }));
    },

    deleteSprint: async (id) => {
      const res = await fetch(apiUrl(`/api/sprints/${id}`), {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      set((state) => ({
        sprints: state.sprints.filter((s) => s.id !== id),
        activeSprintId: state.activeSprintId === id ? null : state.activeSprintId,
      }));
    },

    setActiveSprint: (id) => {
      set({ activeSprintId: id });
    },

    startSprint: async (id) => {
      const existing = get().sprints.find((s) => s.status === 'active');
      if (existing) return;
      const res = await fetch(apiUrl(`/api/sprints/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated: Sprint = await res.json();
      set((state) => ({
        sprints: state.sprints.map((s) => (s.id === id ? updated : s)),
        activeSprintId: id,
      }));
    },

    completeSprint: async (id) => {
      const res = await fetch(apiUrl(`/api/sprints/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated: Sprint = await res.json();
      set((state) => ({
        sprints: state.sprints.map((s) => (s.id === id ? updated : s)),
        activeSprintId: state.activeSprintId === id ? null : state.activeSprintId,
      }));
    },
  })
);