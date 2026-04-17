import { cn } from '@/lib/utils';

const PALETTE = [
  '#6366f1', // indigo-500
  '#8b5cf6', // violet-500
  '#0ea5e9', // sky-500
  '#14b8a6', // teal-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#f43f5e', // rose-500
  '#64748b', // slate-500
];

const getInitials = (displayName: string): string => {
  const parts = displayName.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return displayName.slice(0, 2).toUpperCase();
};

const getColor = (userId: string): string => {
  const sum = userId.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return PALETTE[sum % PALETTE.length];
};

interface InitialsAvatarProps {
  userId: string;
  displayName: string;
  size?: 'sm' | 'lg';
  className?: string;
}

export const InitialsAvatar = ({
  userId,
  displayName,
  size = 'sm',
  className,
}: InitialsAvatarProps) => {
  const initials = getInitials(displayName || '?');
  const bgColor = getColor(userId);

  const sizeClasses =
    size === 'sm'
      ? 'h-8 w-8 text-xs' // 32px, 12px font
      : 'h-10 w-10 text-sm'; // 40px, 14px font

  return (
    <div
      role="img"
      aria-label={`${displayName}'s avatar`}
      className={cn(
        'flex items-center justify-center rounded-full font-semibold text-white select-none shrink-0',
        sizeClasses,
        className,
      )}
      style={{ backgroundColor: bgColor }}
    >
      {initials}
    </div>
  );
};
