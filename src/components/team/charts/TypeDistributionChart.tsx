'use client';

const TYPE_COLORS: Record<string, string> = {
  GOAL: '#8B5CF6',
  STORY: '#3B82F6',
  FEATURE: '#10B981',
  TASK: '#F59E0B',
};

const TYPE_LABELS: Record<string, string> = {
  GOAL: 'Goal',
  STORY: 'Story',
  FEATURE: 'Feature',
  TASK: 'Task',
};

interface TypeDistributionData {
  type: string;
  count: number;
}

interface TypeDistributionChartProps {
  data: TypeDistributionData[];
}

export function TypeDistributionChart({ data }: TypeDistributionChartProps) {
  const total = data.reduce((s, d) => s + d.count, 0);
  if (total === 0) {
    return (
      <div
        style={{
          padding: '24px 0',
          textAlign: 'center',
          color: 'var(--color-text-muted)',
          fontSize: 13,
        }}
      >
        데이터 없음
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {data.map((d) => {
        const pct = total > 0 ? Math.round((d.count / total) * 100) : 0;
        return (
          <div key={d.type}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: TYPE_COLORS[d.type] ?? '#6B7280',
                }}
              >
                {TYPE_LABELS[d.type] ?? d.type}
              </span>
              <span style={{ fontSize: 11, color: '#6B7280' }}>
                {d.count} ({pct}%)
              </span>
            </div>
            <div
              style={{
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
                  background: TYPE_COLORS[d.type] ?? '#6B7280',
                  width: `${pct}%`,
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
