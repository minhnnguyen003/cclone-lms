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

    // Clear module cache to get fresh axios instance with interceptors
    vi.resetModules();
    const axiosModule = await import('@/lib/axios');
    api = axiosModule.api;

    vi.clearAllMocks();
    mockGetState.mockReturnValue({
      accessToken: 'old-access-token',
      setAuth: mockSetAuth,
      clearAuth: mockClearAuth,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: originalLocation,
    });
  });

  it('attaches Bearer token from auth store on requests', async () => {
    // Spy on the request interceptor by making a request and checking config
    const requestSpy = vi.fn();
    api.interceptors.request.use((config) => {
      requestSpy(config.headers.Authorization);
      // Abort the request so we don't need a real server
      throw new Error('abort');
    });

    try {
      await api.get('/test');
    } catch {
      // Expected abort
    }

    expect(requestSpy).toHaveBeenCalledWith('Bearer old-access-token');
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
