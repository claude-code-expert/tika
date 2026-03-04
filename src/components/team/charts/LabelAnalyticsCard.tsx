'use client';

import type { LabelAnalytic } from '@/types/index';

interface LabelAnalyticsCardProps {
  labels: LabelAnalytic[];
}

export function LabelAnalyticsCard({ labels }: LabelAnalyticsCardProps) {
  if (labels.length === 0) {
    return (
      <div
        style={{
          padding: '24px 0',
          textAlign: 'center',
          color: 'var(--color-text-muted)',
          fontSize: 13,
        }}
      >
        라벨 없음
      </div>
    );
  }

  const sorted = [...labels].sort((a, b) => b.count - a.count).slice(0, 10);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {sorted.map((label) => (
        <div key={label.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Color swatch */}
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: label.color,
              flexShrink: 0,
            }}
          />
          {/* Name */}
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: '#374151',
              minWidth: 80,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {label.name}
          </span>
          {/* Bar */}
          <div
            style={{
              flex: 1,
              height: 8,
              borderRadius: 4,
              background: '#F3F4F6',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                borderRadius: 4,
                background: label.color,
                width: `${label.percentage}%`,
                minWidth: label.count > 0 ? 4 : 0,
                transition: 'width 0.4s ease',
              }}
            />
          </div>
          {/* Count + % */}
          <span style={{ fontSize: 11, color: '#9CA3AF', whiteSpace: 'nowrap', minWidth: 55, textAlign: 'right' }}>
            {label.count}건 ({label.percentage}%)
          </span>
        </div>
      ))}
    </div>
  );
}
