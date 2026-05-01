import { create } from 'zustand';
import { apiUrl } from '@/lib/api';
import type { Task, TaskStatus, PullRequest, Commit, TimeEntry, ActivityItem } from '@/types';

interface TaskState {
  tasks: Task[];
  selectedTaskId: string | null;
  loading: boolean;
  error: string | null;
  loaded: boolean;
  fetchTasks: () => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'linkedPRs' | 'linkedCommits' | 'timeEntries' | 'activityFeed'>) => Promise<Task>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  moveTask: (id: string, newStatus: TaskStatus) => Promise<void>;
  selectTask: (id: string | null) => void;
  linkPR: (taskId: string, pr: Omit<PullRequest, 'id' | 'createdAt'>) => Promise<void>;
  updatePR: (taskId: string, prId: string, updates: Partial<PullRequest>) => Promise<void>;
  linkCommit: (taskId: string, commit: Omit<Commit, 'id' | 'createdAt'>) => Promise<void>;
  addTimeEntry: (taskId: string, entry: Omit<TimeEntry, 'id' | 'createdAt'>) => Promise<void>;
  deleteTimeEntry: (taskId: string, entryId: string) => Promise<void>;
  addActivity: (taskId: string, activity: Omit<ActivityItem, 'id' | 'createdAt'>) => Promise<void>;
  mergePR: (taskId: string, prId: string) => Promise<void>;
}

export const useTaskStore = create<TaskState>()(
  (set, get) => ({
    tasks: [],
    selectedTaskId: null,
    loading: false,
    error: null,
    loaded: false,

    fetchTasks: async () => {
      if (get().loading || get().loaded) return;
      set({ loading: true, error: null });
      try {
        const res = await fetch(apiUrl('/api/tasks'));
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const items = await res.json();
        set({ tasks: items, loading: false, loaded: true });
      } catch (err) {
        set({ loading: false, error: err instanceof Error ? err.message : 'Failed to load' });
      }
    },

    addTask: async (taskData) => {
      const res = await fetch(apiUrl('/api/tasks'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const newTask: Task = await res.json();
      set((state) => ({ tasks: [...state.tasks, newTask] }));
      return newTask;
    },

    updateTask: async (id, updates) => {
      const res = await fetch(apiUrl(`/api/tasks/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updatedTask: Task = await res.json();
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? updatedTask : t)),
      }));
    },

    deleteTask: async (id) => {
      const res = await fetch(apiUrl(`/api/tasks/${id}`), {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id),
        selectedTaskId: state.selectedTaskId === id ? null : state.selectedTaskId,
      }));
    },

    moveTask: async (id, newStatus) => {
      const task = get().tasks.find((t) => t.id === id);
      if (!task) return;
      const oldStatus = task.status;
      const updates = {
        status: newStatus,
        activityFeed: [
          ...task.activityFeed,
          {
            id: `act_${Date.now()}`,
            createdAt: new Date(),
            taskId: id,
            userId: 'system',
            userName: 'System',
            type: 'status_change' as const,
            content: `Status changed from ${oldStatus.replace('_', ' ')} to ${newStatus.replace('_', ' ')}`,
          },
        ],
      };
      const res = await fetch(apiUrl(`/api/tasks/${id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updatedTask: Task = await res.json();
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? updatedTask : t)),
      }));
    },

    selectTask: (id) => {
      set({ selectedTaskId: id });
    },

    linkPR: async (taskId, prData) => {
      const task = get().tasks.find((t) => t.id === taskId);
      if (!task) return;
      const pr: PullRequest = {
        ...prData,
        id: `pr_${Date.now()}`,
        createdAt: new Date(),
      };
      const updates = {
        linkedPRs: [...task.linkedPRs, pr],
        activityFeed: [
          ...task.activityFeed,
          {
            id: `act_${Date.now()}`,
            createdAt: new Date(),
            taskId,
            userId: 'system',
            userName: 'System',
            type: 'pr_linked' as const,
            content: `PR #${pr.number} "${pr.title}" linked`,
          },
        ],
      };
      const res = await fetch(apiUrl(`/api/tasks/${taskId}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updatedTask: Task = await res.json();
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === taskId ? updatedTask : t)),
      }));
    },

    updatePR: async (taskId, prId, updates) => {
      const task = get().tasks.find((t) => t.id === taskId);
      if (!task) return;
      const updatedPRs = task.linkedPRs.map((pr) =>
        pr.id === prId ? { ...pr, ...updates } : pr
      );
      const res = await fetch(apiUrl(`/api/tasks/${taskId}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkedPRs: updatedPRs }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updatedTask: Task = await res.json();
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === taskId ? updatedTask : t)),
      }));
    },

    linkCommit: async (taskId, commitData) => {
      const task = get().tasks.find((t) => t.id === taskId);
      if (!task) return;
      const commit: Commit = {
        ...commitData,
        id: `commit_${Date.now()}`,
        createdAt: new Date(),
      };
      const updates = {
        linkedCommits: [...task.linkedCommits, commit],
        activityFeed: [
          ...task.activityFeed,
          {
            id: `act_${Date.now()}`,
            createdAt: new Date(),
            taskId,
            userId: 'system',
            userName: 'System',
            type: 'commit_linked' as const,
            content: `Commit ${commit.sha.slice(0, 7)}: ${commit.message}`,
          },
        ],
      };
      const res = await fetch(apiUrl(`/api/tasks/${taskId}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updatedTask: Task = await res.json();
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === taskId ? updatedTask : t)),
      }));
    },

    addTimeEntry: async (taskId, entryData) => {
      const task = get().tasks.find((t) => t.id === taskId);
      if (!task) return;
      const entry: TimeEntry = {
        ...entryData,
        id: `time_${Date.now()}`,
        createdAt: new Date(),
      };
      const updates = {
        timeEntries: [...task.timeEntries, entry],
        activityFeed: [
          ...task.activityFeed,
          {
            id: `act_${Date.now()}`,
            createdAt: new Date(),
            taskId,
            userId: entry.userId,
            userName: entry.userId,
            type: 'time_logged' as const,
            content: `Logged ${entry.hours}h: ${entry.description}`,
          },
        ],
      };
      const res = await fetch(apiUrl(`/api/tasks/${taskId}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updatedTask: Task = await res.json();
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === taskId ? updatedTask : t)),
      }));
    },

    deleteTimeEntry: async (taskId, entryId) => {
      const task = get().tasks.find((t) => t.id === taskId);
      if (!task) return;
      const updates = {
        timeEntries: task.timeEntries.filter((e) => e.id !== entryId),
      };
      const res = await fetch(apiUrl(`/api/tasks/${taskId}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updatedTask: Task = await res.json();
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === taskId ? updatedTask : t)),
      }));
    },

    addActivity: async (taskId, activityData) => {
      const task = get().tasks.find((t) => t.id === taskId);
      if (!task) return;
      const activity: ActivityItem = {
        ...activityData,
        id: `act_${Date.now()}`,
        createdAt: new Date(),
      };
      const updates = {
        activityFeed: [...task.activityFeed, activity],
      };
      const res = await fetch(apiUrl(`/api/tasks/${taskId}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updatedTask: Task = await res.json();
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === taskId ? updatedTask : t)),
      }));
    },

    mergePR: async (taskId, prId) => {
      const task = get().tasks.find((t) => t.id === taskId);
      if (!task) return;
      const pr = task.linkedPRs.find((p) => p.id === prId);
      if (!pr) return;
      const updates = {
        status: 'done',
        linkedPRs: task.linkedPRs.map((p) =>
          p.id === prId ? { ...p, status: 'merged' } : p
        ),
        activityFeed: [
          ...task.activityFeed,
          {
            id: `act_${Date.now()}_1`,
            createdAt: new Date(),
            taskId,
            userId: 'system',
            userName: 'System',
            type: 'pr_linked' as const,
            content: `PR #${pr.number} merged`,
          },
          {
            id: `act_${Date.now()}_2`,
            createdAt: new Date(),
            taskId,
            userId: 'system',
            userName: 'System',
            type: 'status_change' as const,
            content: 'Task automatically moved to Done (PR merged)',
          },
        ],
      };
      const res = await fetch(apiUrl(`/api/tasks/${taskId}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updatedTask: Task = await res.json();
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === taskId ? updatedTask : t)),
      }));
    },
  })
);