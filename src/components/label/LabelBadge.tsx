'use client';

import type { Label } from '@/types/index';

// luminosity-based text color (same logic as LabelSection)
function labelTextColor(hex: string): string {
  try {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return 0.299 * r + 0.587 * g + 0.114 * b > 160 ? '#333' : '#fff';
  } catch {
    return '#fff';
  }
}

interface LabelBadgeProps {
  label: Pick<Label, 'name' | 'color'>;
  size?: 'sm' | 'md';
  onRemove?: () => void;
}

export function LabelBadge({ label, size = 'sm', onRemove }: LabelBadgeProps) {
  const tc = labelTextColor(label.color);
  const sizeStyle =
    size === 'md'
      ? { height: 24, padding: '0 12px', borderRadius: 12, fontSize: 12, fontWeight: 600 }
      : { height: 20, padding: '0 9px', borderRadius: 10, fontSize: 11, fontWeight: 500 };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        whiteSpace: 'nowrap' as const,
        userSelect: 'none' as const,
        background: label.color,
        color: tc,
        flexShrink: 0,
        ...sizeStyle,
      }}
    >
      {label.name}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          aria-label={`${label.name} 라벨 제거`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 12,
            height: 12,
            border: 'none',
            background: 'transparent',
            color: 'inherit',
            cursor: 'pointer',
            padding: 0,
            opacity: 0.7,
            fontSize: 11,
            lineHeight: 1,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.7'; }}
        >
          ×
        </button>
      )}
    </span>
  );
}

// re-export text color utility for reuse
export { labelTextColor };
