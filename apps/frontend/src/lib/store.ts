// ============================================
// ContentPilot AI — Auth Store (Zustand)
// ============================================

import { create } from 'zustand';
import { api } from './api';

interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: string;
  preferredModel: string | null;
}

interface AuthStore {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    const response: any = await api.post('/api/auth/login', { email, password });
    const tokens = response.data ?? response;
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);

    // Load user profile — use same fallback as loadUser()
    const userRes: any = await api.get('/api/auth/me');
    set({ user: userRes.data ?? userRes, isAuthenticated: true, isLoading: false });
  },

  register: async (email: string, password: string, name: string) => {
    const response: any = await api.post('/api/auth/register', { email, password, name });
    const tokens = response.data ?? response;
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);

    // Load user profile — use same fallback as loadUser()
    const userRes: any = await api.get('/api/auth/me');
    set({ user: userRes.data ?? userRes, isAuthenticated: true, isLoading: false });
  },

  logout: async () => {
    try {
      await api.post('/api/auth/logout');
    } catch {
      // Clear the local session even if the network request cannot complete.
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({ user: null, isAuthenticated: false, isLoading: false });
    window.location.assign('/login');
  },

  loadUser: async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
      set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }

      const user: any = await api.get('/api/auth/me');
      set({ user: user.data ?? user, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  setUser: (user: User) => set({ user }),
}));
