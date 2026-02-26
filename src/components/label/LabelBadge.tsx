'use client';

import type { Label } from '@/types/index';

type LabelSize = 'xs' | 'sm';

interface LabelBadgeProps {
  label: Label;
  size?: LabelSize;
}

export function LabelBadge({ label, size = 'sm' }: LabelBadgeProps) {
  const height = size === 'xs' ? 16 : 20;
  const padding = size === 'xs' ? '0 6px' : '0 8px';
  const fontSize = size === 'xs' ? 9 : 10;
  const dotSize = size === 'xs' ? 5 : 6;
  const gap = size === 'xs' ? 3 : 4;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap,
        height,
        padding,
        borderRadius: 4,
        fontSize,
        fontWeight: 600,
        fontFamily: "'Plus Jakarta Sans', 'Noto Sans KR', sans-serif",
        whiteSpace: 'nowrap',
        userSelect: 'none',
        backgroundColor: label.color + '22',
        color: label.color,
      }}
    >
      <span
        style={{
          display: 'inline-block',
          borderRadius: '50%',
          backgroundColor: label.color,
          width: dotSize,
          height: dotSize,
          flexShrink: 0,
        }}
      />
      {label.name}
    </span>
  );
}
