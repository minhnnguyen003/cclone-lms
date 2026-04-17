import { create } from 'zustand';

interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  timezone: string;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isHydrating: boolean;
  setAuth: (user: AuthUser, accessToken: string) => void;
  setAccessToken: (token: string) => void;
  setUser: (user: AuthUser) => void;
  clearAuth: () => void;
  setHydrating: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isHydrating: true,

  setAuth: (user: AuthUser, accessToken: string) =>
    set({ user, accessToken, isAuthenticated: true, isHydrating: false }),

  setAccessToken: (token: string) => set({ accessToken: token, isAuthenticated: true }),

  setUser: (user: AuthUser) => set({ user }),

  clearAuth: () =>
    set({ user: null, accessToken: null, isAuthenticated: false, isHydrating: false }),

  setHydrating: (value: boolean) => set({ isHydrating: value }),
}));
