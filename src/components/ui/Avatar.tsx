'use client';

type AvatarSize = 'xs' | 'sm' | 'md';

const sizeClasses: Record<AvatarSize, string> = {
  xs: 'h-5 w-5 text-[9px]',
  sm: 'h-7 w-7 text-[10px]',
  md: 'h-9 w-9 text-xs',
};

interface AvatarProps {
  displayName: string;
  color?: string;
  size?: AvatarSize;
  tooltip?: string;
}

export function Avatar({ displayName, color = '#7EB4A2', size = 'sm', tooltip }: AvatarProps) {
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-bold text-white ${sizeClasses[size]}`}
      style={{ backgroundColor: color }}
      title={tooltip ?? displayName}
      aria-label={tooltip ?? displayName}
    >
      {initials}
    </span>
  );
}
