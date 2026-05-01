import { cn } from '@/lib/utils';

interface AvatarProps {
  initials: string;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

const sizeClasses = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-10 h-10 text-base',
};

export function Avatar({ initials, size = 'md', color, className }: AvatarProps) {
  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-semibold text-primary-foreground flex-shrink-0',
        sizeClasses[size],
        className
      )}
      style={{ background: color || 'var(--brand-blue)' }}
    >
      {initials}
    </div>
  );
}
