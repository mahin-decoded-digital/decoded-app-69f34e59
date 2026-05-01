import { create } from 'zustand';
import { apiUrl } from '@/lib/api';
import type { Project } from '@/types';

interface ProjectState {
  projects: Project[];
  activeProjectId: string | null;
  loading: boolean;
  error: string | null;
  loaded: boolean;
  addProject: (project: Omit<Project, 'id' | 'createdAt'>) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  setActiveProject: (id: string | null) => void;
  fetchProjects: () => Promise<void>;
}

export const useProjectStore = create<ProjectState>()(
  (set, get) => ({
    projects: [],
    activeProjectId: null,
    loading: false,
    error: null,
    loaded: false,

    addProject: async (projectData) => {
      const res = await fetch(apiUrl('/api/projects'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const newProject: Project = await res.json();
      set((state) => ({ projects: [...state.projects, newProject] }));
      return newProject;
    },

    updateProject: async (id, updates) => {
      const res = await fetch(apiUrl(`/api/projects/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updatedProject: Project = await res.json();
      set((state) => ({
        projects: state.projects.map((p) => (p.id === id ? updatedProject : p)),
      }));
    },

    deleteProject: async (id) => {
      const res = await fetch(apiUrl(`/api/projects/${id}`), {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
        activeProjectId: state.activeProjectId === id ? null : state.activeProjectId,
      }));
    },

    setActiveProject: (id) => {
      set({ activeProjectId: id });
    },

    fetchProjects: async () => {
      if (get().loading || get().loaded) return;
      set({ loading: true, error: null });
      try {
        const res = await fetch(apiUrl('/api/projects'));
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const items = await res.json();
        set({ projects: items, loading: false, loaded: true });
      } catch (err) {
        set({ loading: false, error: err instanceof Error ? err.message : 'Failed to load' });
      }
    },
  })
);