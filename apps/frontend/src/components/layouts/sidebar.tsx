import { GraduationCap, LogOut, Settings } from 'lucide-react';
import { Link } from 'react-router';

import { Button } from '@/components/ui/button';
import { InitialsAvatar } from '@/components/ui/initials-avatar';
import { api } from '@/lib/axios';
import { useAuthStore } from '@/stores/auth-store';

export const Sidebar = () => {
  const { user, clearAuth } = useAuthStore();

  const handleLogout = async (): Promise<void> => {
    try {
      await api.delete('/auth/logout');
    } catch {
      // Logout should succeed client-side even if server call fails
    }
    clearAuth();
    window.location.href = '/login';
  };

  return (
    <aside className="flex h-full w-[256px] shrink-0 flex-col border-r border-border bg-card">
      {/* Logo */}
      <div className="flex items-center gap-2 border-b border-border px-4 py-6">
        <GraduationCap className="h-5 w-5 text-primary" />
        <span className="text-sm font-semibold">CClone LMS</span>
      </div>

      {/* Empty space — nav items added by subsequent phases per D-16 */}
      <div className="flex-1" />

      {/* User section */}
      <div className="border-t border-border px-2 py-4">
        <div className="flex items-center gap-2 rounded-md px-2 py-2">
          {user && (
            <InitialsAvatar
              userId={user.id}
              displayName={user.name ?? user.email}
              size="sm"
            />
          )}
          <div className="min-w-0 flex-1">
            <p
              className="truncate text-sm font-semibold text-foreground"
              style={{ maxWidth: 140 }}
            >
              {user?.name ?? 'User'}
            </p>
            <p
              className="truncate text-xs text-muted-foreground"
              style={{ maxWidth: 140 }}
            >
              {user?.email ?? ''}
            </p>
          </div>
          <Link to="/profile" aria-label="Account settings" className="ml-auto">
            <Settings className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </Link>
        </div>

        <Button
          variant="ghost"
          className="mt-1 w-full min-h-[44px] justify-start gap-2 text-sm text-destructive hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Log out
        </Button>
      </div>
    </aside>
  );
};
