'use client';

interface ProgressDonutProps {
  value: number; // 0-100 percentage
  label?: string;
  size?: number;
  strokeWidth?: number;
  color?: string;
}

export function ProgressDonut({
  value,
  label,
  size = 80,
  strokeWidth = 8,
  color = '#629584',
}: ProgressDonutProps) {
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const clampedValue = Math.min(100, Math.max(0, value));
  const offset = circumference - (clampedValue / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ display: 'block', transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#F3F4F6"
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      {/* Center text */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
        }}
      >
        <span style={{ fontSize: size < 70 ? 12 : 16, fontWeight: 700, color: '#2C3E50', lineHeight: 1 }}>
          {clampedValue}%
        </span>
        {label && (
          <span style={{ fontSize: 9, color: '#9CA3AF', lineHeight: 1, textAlign: 'center' }}>
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
