import { useEffect } from 'react';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router';

import { AppLayout } from '@/components/layouts/app-layout';
import { AuthLayout } from '@/components/layouts/auth-layout';
import { PrivateRoute } from '@/components/layouts/private-route';
import { api } from '@/lib/axios';
import { DashboardPage } from '@/pages/dashboard';
import { LoginPage } from '@/pages/login';
import { PlaceholderPage } from '@/pages/placeholder';
import { ProfilePage } from '@/pages/profile';
import { SignupPage } from '@/pages/signup';
import { useAuthStore } from '@/stores/auth-store';

const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/signup', element: <SignupPage /> },
    ],
  },
  {
    element: <PrivateRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/profile', element: <ProfilePage /> },
          { path: '/courses', element: <PlaceholderPage title="Courses" /> },
          { path: '/assignments', element: <PlaceholderPage title="Assignments" /> },
          { path: '/gradebook', element: <PlaceholderPage title="Gradebook" /> },
        ],
      },
    ],
  },
  { path: '/', element: <Navigate to="/dashboard" replace /> },
  { path: '*', element: <Navigate to="/dashboard" replace /> },
]);

export const App = () => {
  const { setAuth, clearAuth } = useAuthStore();

  useEffect(() => {
    // Attempt silent refresh on app mount to restore session
    const hydrate = async (): Promise<void> => {
      try {
        const { data } = await api.post('/auth/refresh');
        setAuth(data.data.user, data.data.accessToken);
      } catch {
        // No valid refresh token — user needs to log in
        clearAuth();
      }
    };

    void hydrate();
  }, [setAuth, clearAuth]);

  return <RouterProvider router={router} />;
};
