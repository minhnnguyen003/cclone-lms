import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// Mock the auth store BEFORE importing App so the RouterProvider renders with a
// known store state. isHydrating: true matches the real initial store value and
// causes PrivateRoute to render the full-screen loading spinner.
vi.mock('@/stores/auth-store', () => ({
  useAuthStore: vi.fn(() => ({
    isHydrating: true,
    isAuthenticated: false,
    user: null,
    accessToken: null,
    setAuth: vi.fn(),
    clearAuth: vi.fn(),
    setHydrating: vi.fn(),
  })),
}));

// Mock the api module so the useEffect /auth/refresh call does not fire real HTTP.
vi.mock('@/lib/axios', () => ({
  api: {
    post: vi.fn().mockRejectedValue(new Error('no server in tests')),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

import { App } from '@/App';

describe('App', () => {
  it('renders the hydration loading spinner on initial mount', () => {
    render(<App />);
    // PrivateRoute renders a div with aria-label="Loading" when isHydrating is true.
    // This is the correct Phase 2 behaviour — the app shows a spinner while the
    // refresh token check is in flight, before showing any page content.
    const loadingDiv = screen.getByRole('generic', { name: 'Loading' });
    expect(loadingDiv).toBeDefined();
  });
});
