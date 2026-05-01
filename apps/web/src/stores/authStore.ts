import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserRole } from '@/types';

interface AuthState {
  users: User[];
  currentUser: User | null;
  register: (email: string, password: string, name: string, role: UserRole) => { ok: boolean; error?: string };
  login: (email: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
  updateProfile: (updates: Partial<Pick<User, 'name' | 'email'>>) => void;
}

// Store passwords separately (not in user objects for clean separation)
interface PasswordStore {
  passwords: Record<string, string>;
}

const passwordStore: PasswordStore = { passwords: {} };

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      users: [],
      currentUser: null,

      register: (email, password, name, role) => {
        const existing = get().users.find((u) => u.email === email);
        if (existing) {
          return { ok: false, error: 'Email already registered' };
        }
        const newUser: User = {
          id: `user_${Date.now()}`,
          createdAt: new Date(),
          email,
          name,
          role,
          avatarInitials: name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2),
        };
        passwordStore.passwords[email] = password;
        set((state) => ({
          users: [...state.users, newUser],
          currentUser: newUser,
        }));
        return { ok: true };
      },

      login: (email, password) => {
        const user = get().users.find((u) => u.email === email);
        if (!user) {
          return { ok: false, error: 'Invalid credentials' };
        }
        if (passwordStore.passwords[email] !== password) {
          return { ok: false, error: 'Invalid credentials' };
        }
        set({ currentUser: user });
        return { ok: true };
      },

      logout: () => {
        set({ currentUser: null });
      },

      updateProfile: (updates) => {
        const current = get().currentUser;
        if (!current) return;
        const updated = { ...current, ...updates };
        if (updates.name) {
          updated.avatarInitials = updates.name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
        }
        set((state) => ({
          users: state.users.map((u) => (u.id === current.id ? updated : u)),
          currentUser: updated,
        }));
      },
    }),
    {
      name: 'devflow-auth',
    }
  )
);
