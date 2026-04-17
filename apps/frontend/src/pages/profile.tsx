import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { InitialsAvatar } from '@/components/ui/initials-avatar';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/axios';
import { useAuthStore } from '@/stores/auth-store';

const profileSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters.')
    .max(100, 'Name must be at most 100 characters.'),
  timezone: z.string().max(50, 'Timezone is too long.'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const COMMON_TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Moscow',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Ho_Chi_Minh',
  'Asia/Kolkata',
  'Asia/Dubai',
  'Australia/Sydney',
  'Pacific/Auckland',
];

export const ProfilePage = () => {
  const { user, setUser } = useAuthStore();
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name ?? '',
      timezone: user?.timezone ?? 'UTC',
    },
  });

  const onSubmit = async (data: ProfileFormData): Promise<void> => {
    setIsSaving(true);
    setSaveError(null);

    try {
      const response = await api.patch('/users/me', {
        name: data.name,
        timezone: data.timezone,
      });
      const updatedUser = response.data.data;
      setUser(updatedUser);
      reset({ name: updatedUser.name ?? data.name, timezone: updatedUser.timezone ?? data.timezone });
      toast('Display name updated.', { duration: 3000 });
    } catch {
      setSaveError('Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Account settings</h1>

      {/* Identity header */}
      <div className="mb-6 flex items-center gap-4">
        <InitialsAvatar userId={user.id} displayName={user.name ?? user.email} size="lg" />
        <div>
          <p className="text-sm font-semibold">{user.name ?? 'User'}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Avatar upload coming in a future update.</p>

      {/* Profile edit form */}
      <div className="mt-6">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-1.5">
                <Label htmlFor="display-name">Display name</Label>
                <Input
                  id="display-name"
                  type="text"
                  aria-invalid={!!errors.name}
                  {...register('name')}
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="timezone">Timezone</Label>
                <select
                  id="timezone"
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                  aria-invalid={!!errors.timezone}
                  {...register('timezone')}
                >
                  {COMMON_TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
                {errors.timezone && (
                  <p className="text-xs text-destructive">{errors.timezone.message}</p>
                )}
              </div>

              {saveError && (
                <p className="text-xs text-destructive">{saveError}</p>
              )}
            </CardContent>
            <CardFooter className="justify-end">
              <Button type="submit" disabled={!isDirty || isSaving}>
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Save changes'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};
