import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// Mock zustand auth store before importing axios module
const mockSetAuth = vi.fn();
const mockClearAuth = vi.fn();
const mockGetState = vi.fn(() => ({
  accessToken: 'old-access-token',
  setAuth: mockSetAuth,
  clearAuth: mockClearAuth,
}));

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: {
    getState: mockGetState,
  },
}));

// Mock window.location
const originalLocation = window.location;

describe('axios silent refresh interceptor', () => {
  let api: typeof import('@/lib/axios').api;

  beforeEach(async () => {
    // Reset window.location mock for redirect tests
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...originalLocation, pathname: '/dashboard', search: '', href: '' },
    });

    // Clear module cache to get a fresh axios instance with clean interceptors
    vi.resetModules();
    const axiosModule = await import('@/lib/axios');
    api = axiosModule.api;

    // Restore mock return value AFTER module import (so the request interceptor
    // inside the freshly-loaded module sees the correct accessToken when it fires)
    mockGetState.mockReturnValue({
      accessToken: 'old-access-token',
      setAuth: mockSetAuth,
      clearAuth: mockClearAuth,
    });
  });

  afterEach(() => {
    // Clear mocks AFTER each test, not before — clearing in beforeEach would wipe
    // the return value set above before the test body runs, causing the interceptor
    // to see accessToken: undefined on the first request in each test.
    vi.clearAllMocks();

    Object.defineProperty(window, 'location', {
      writable: true,
      value: originalLocation,
    });
  });

  it('attaches Bearer token from auth store on requests', async () => {
    // Use a custom adapter to inspect config AFTER all request interceptors have run.
    // axios request interceptors run in LIFO order — a spy added via interceptors.request.use()
    // would run BEFORE the token-setting interceptor from axios.ts, seeing undefined.
    // The adapter is the final step in the pipeline: it receives the fully-processed config
    // with all interceptor mutations applied.
    let capturedAuthorization: string | undefined;
    api.defaults.adapter = async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
      capturedAuthorization = config.headers.Authorization as string;
      return {
        data: {},
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };

    await api.get('/test');

    expect(capturedAuthorization).toBe('Bearer old-access-token');
  });

  it('triggers refresh on 401 response and retries original request', async () => {
    // Mock adapter to simulate 401 then successful refresh then retry success
    let callCount = 0;
    api.defaults.adapter = async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
      callCount++;

      if (callCount === 1) {
        // First call: original request gets 401
        const error = new Error('Unauthorized') as AxiosError;
        error.response = { status: 401, data: {}, headers: {}, statusText: 'Unauthorized', config } as AxiosResponse;
        error.config = config;
        error.isAxiosError = true;
        throw error;
      }

      if (callCount === 2 && config.url === '/auth/refresh') {
        // Second call: refresh succeeds
        return {
          data: { data: { accessToken: 'new-access-token', user: { id: '1', email: 'test@test.com', name: 'Test', role: 'STUDENT', timezone: 'UTC' } } },
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        };
      }

      if (callCount === 3) {
        // Third call: retried original request succeeds
        return {
          data: { success: true },
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        };
      }

      throw new Error(`Unexpected call #${callCount}`);
    };

    const response = await api.get('/protected-resource');

    expect(response.data).toEqual({ success: true });
    expect(mockSetAuth).toHaveBeenCalledWith(
      { id: '1', email: 'test@test.com', name: 'Test', role: 'STUDENT', timezone: 'UTC' },
      'new-access-token',
    );
    expect(callCount).toBe(3);
  });

  it('queues concurrent 401 responses and retries all after a single refresh', async () => {
    let callCount = 0;
    const requestUrls: string[] = [];

    api.defaults.adapter = async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
      callCount++;
      requestUrls.push(config.url ?? '');

      // First two calls: both get 401
      if (callCount <= 2 && config.url !== '/auth/refresh') {
        const error = new Error('Unauthorized') as AxiosError;
        error.response = { status: 401, data: {}, headers: {}, statusText: 'Unauthorized', config } as AxiosResponse;
        error.config = config;
        error.isAxiosError = true;
        throw error;
      }

      // Refresh call
      if (config.url === '/auth/refresh') {
        return {
          data: { data: { accessToken: 'new-token', user: { id: '1', email: 'a@b.com', name: 'A', role: 'STUDENT', timezone: 'UTC' } } },
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        };
      }

      // Retried requests succeed
      return {
        data: { url: config.url },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };

    // Fire two requests concurrently
    const [res1, res2] = await Promise.all([
      api.get('/resource-a'),
      api.get('/resource-b'),
    ]);

    expect(res1.data).toEqual({ url: '/resource-a' });
    expect(res2.data).toEqual({ url: '/resource-b' });

    // Only one refresh call should have been made
    const refreshCalls = requestUrls.filter((u) => u === '/auth/refresh');
    expect(refreshCalls).toHaveLength(1);
  });

  it('rejects all queued requests and calls logout when refresh fails', async () => {
    let callCount = 0;

    api.defaults.adapter = async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
      callCount++;

      if (callCount === 1) {
        // Original request gets 401
        const error = new Error('Unauthorized') as AxiosError;
        error.response = { status: 401, data: {}, headers: {}, statusText: 'Unauthorized', config } as AxiosResponse;
        error.config = config;
        error.isAxiosError = true;
        throw error;
      }

      if (config.url === '/auth/refresh') {
        // Refresh also fails with 401
        const error = new Error('Unauthorized') as AxiosError;
        error.response = { status: 401, data: {}, headers: {}, statusText: 'Unauthorized', config } as AxiosResponse;
        error.config = config;
        error.isAxiosError = true;
        throw error;
      }

      throw new Error(`Unexpected call #${callCount}`);
    };

    await expect(api.get('/protected-resource')).rejects.toThrow();

    expect(mockClearAuth).toHaveBeenCalledTimes(1);
    expect(window.location.href).toContain('/login?next=');
  });

  it('does not retry when _retry flag is already set (prevents infinite loop)', async () => {
    let callCount = 0;

    api.defaults.adapter = async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
      callCount++;
      // Always return 401
      const error = new Error('Unauthorized') as AxiosError;
      error.response = { status: 401, data: {}, headers: {}, statusText: 'Unauthorized', config } as AxiosResponse;
      error.config = { ...config, _retry: true } as InternalAxiosRequestConfig & { _retry: boolean };
      error.isAxiosError = true;
      throw error;
    };

    await expect(api.get('/test')).rejects.toThrow();

    // Should only make 1 call — no refresh attempt because _retry is set
    expect(callCount).toBe(1);
  });

  it('does not intercept 401 from the /auth/refresh endpoint itself', async () => {
    let callCount = 0;

    api.defaults.adapter = async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
      callCount++;
      const error = new Error('Unauthorized') as AxiosError;
      error.response = { status: 401, data: {}, headers: {}, statusText: 'Unauthorized', config } as AxiosResponse;
      error.config = config;
      error.isAxiosError = true;
      throw error;
    };

    await expect(api.post('/auth/refresh')).rejects.toThrow();

    // Should only make 1 call — no recursive refresh
    expect(callCount).toBe(1);
  });
});
