import { createBrowserRouter, RouterProvider } from 'react-router';

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">CClone LMS</h1>
          <p className="mt-2 text-gray-600">Phase 1 — Scaffold OK</p>
        </div>
      </div>
    ),
  },
]);

export const App = () => <RouterProvider router={router} />;
