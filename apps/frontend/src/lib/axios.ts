import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';

import { useAuthStore } from '@/stores/auth-store';

export const api = axios.create({
  baseURL: '/',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Send cookies on all requests (needed for refresh)
});

// Request interceptor: attach access token from Zustand store
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: silent refresh on 401
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null): void => {
  failedQueue.forEach((promise) => {
    if (token) {
      promise.resolve(token);
    } else {
      promise.reject(error);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Only intercept 401 errors, not on retry, and not on auth endpoints that
    // intentionally return 401 (login/signup/refresh) — those handle errors themselves
    const AUTH_ENDPOINTS = ['/auth/refresh', '/auth/login', '/auth/signup'];
    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      AUTH_ENDPOINTS.includes(originalRequest.url ?? '')
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Queue this request while refresh is in progress
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const { data } = await api.post('/auth/refresh');
      const newToken = data.data.accessToken as string;
      const newUser = data.data.user;

      useAuthStore.getState().setAuth(newUser, newToken);
      processQueue(null, newToken);

      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      useAuthStore.getState().clearAuth();

      // Redirect to login with current path as next destination
      const currentPath = window.location.pathname + window.location.search;
      window.location.href = `/login?next=${encodeURIComponent(currentPath)}`;

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
