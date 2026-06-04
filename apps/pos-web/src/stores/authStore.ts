import { create } from 'zustand';
import api from '../api/client';

interface User {
  userId: string;
  name: string;
  email: string;
  role: string;
  tenantId: string;
  outletId: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { accessToken, refreshToken, user } = res.data;
    localStorage.setItem('pos_access_token', accessToken);
    localStorage.setItem('pos_refresh_token', refreshToken);
    localStorage.setItem('pos_user', JSON.stringify(user));
    set({ user, token: accessToken, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('pos_access_token');
    localStorage.removeItem('pos_refresh_token');
    localStorage.removeItem('pos_user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  hydrate: () => {
    const token = localStorage.getItem('pos_access_token');
    const userStr = localStorage.getItem('pos_user');
    if (token && userStr) {
      set({ user: JSON.parse(userStr), token, isAuthenticated: true });
    }
  },
}));
