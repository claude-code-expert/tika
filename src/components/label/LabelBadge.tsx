'use client';

import type { Label } from '@/types/index';

type LabelSize = 'xs' | 'sm';

const sizeClasses: Record<LabelSize, string> = {
  xs: 'px-1.5 py-0.5 text-[10px] gap-1',
  sm: 'px-2 py-0.5 text-xs gap-1.5',
};

interface LabelBadgeProps {
  label: Label;
  size?: LabelSize;
}

export function LabelBadge({ label, size = 'sm' }: LabelBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${sizeClasses[size]}`}
      style={{ backgroundColor: label.color + '22', color: label.color }}
    >
      <span
        className="inline-block rounded-full"
        style={{
          backgroundColor: label.color,
          width: size === 'xs' ? '5px' : '6px',
          height: size === 'xs' ? '5px' : '6px',
        }}
      />
      {label.name}
    </span>
  );
}
