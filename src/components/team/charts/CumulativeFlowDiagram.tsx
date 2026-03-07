'use client';

import type { CfdDataPoint } from '@/types/index';

interface CumulativeFlowDiagramProps {
  data: CfdDataPoint[];
  height?: number;
}

const STATUS_COLORS: Record<string, string> = {
  done: '#629584',
  inProgress: '#F59E0B',
  todo: '#3B82F6',
  backlog: '#E5E7EB',
};

const STATUS_LABELS: Record<string, string> = {
  done: 'Done',
  inProgress: 'In Progress',
  todo: 'Todo',
  backlog: 'Backlog',
};

export function CumulativeFlowDiagram({ data, height = 200 }: CumulativeFlowDiagramProps) {
  if (data.length === 0) {
    return (
      <div
        style={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-text-muted)',
          fontSize: 13,
        }}
      >
        데이터 없음
      </div>
    );
  }

  const width = 600;
  const padL = 40;
  const padR = 16;
  const padT = 16;
  const padB = 32;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;
  const n = data.length;

  const maxTotal = Math.max(...data.map((d) => d.backlog + d.todo + d.inProgress + d.done), 1);

  const xScale = (i: number) => padL + (i / Math.max(n - 1, 1)) * innerW;
  const yScale = (v: number) => padT + innerH - (v / maxTotal) * innerH;

  // Build stacked areas: backlog (bottom), todo, inProgress, done (top)
  const keys = ['backlog', 'todo', 'inProgress', 'done'] as const;

  const stacked = data.map((d) => {
    const cumulative: Record<string, number> = {};
    let acc = 0;
    for (const k of keys) {
      acc += d[k];
      cumulative[k] = acc;
    }
    return cumulative;
  });

  const buildAreaPath = (key: (typeof keys)[number], prevKey?: (typeof keys)[number]) => {
    const topPts = data.map((_, i) => `${xScale(i).toFixed(1)},${yScale(stacked[i][key]).toFixed(1)}`);
    const botPts = prevKey
      ? [...data].reverse().map((_, ri) => {
          const i = n - 1 - ri;
          return `${xScale(i).toFixed(1)},${yScale(stacked[i][prevKey]).toFixed(1)}`;
        })
      : [`${xScale(n - 1).toFixed(1)},${(padT + innerH).toFixed(1)}`, `${padL.toFixed(1)},${(padT + innerH).toFixed(1)}`];

    return `M ${topPts.join(' L ')} L ${botPts.join(' L ')} Z`;
  };

  const labelStep = Math.max(1, Math.floor(n / 6));

  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
        {/* Areas */}
        {keys.map((key, ki) => (
          <path
            key={key}
            d={buildAreaPath(key, ki > 0 ? keys[ki - 1] : undefined)}
            fill={STATUS_COLORS[key]}
            fillOpacity={0.85}
          />
        ))}

        {/* Y axis */}
        {[0, Math.round(maxTotal / 2), maxTotal].map((v) => (
          <g key={v}>
            <line x1={padL} x2={padL + innerW} y1={yScale(v)} y2={yScale(v)} stroke="#fff" strokeWidth={0.5} strokeOpacity={0.5} />
            <text x={padL - 4} y={yScale(v) + 4} textAnchor="end" fontSize={9} fill="#9CA3AF">{v}</text>
          </g>
        ))}

        {/* X axis labels */}
        {data.map((d, i) =>
          i % labelStep === 0 || i === n - 1 ? (
            <text key={i} x={xScale(i)} y={height - 6} textAnchor="middle" fontSize={8} fill="#9CA3AF">
              {d.date.slice(5)}
            </text>
          ) : null,
        )}
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 8 }}>
        {[...keys].reverse().map((k) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: STATUS_COLORS[k] }} />
            <span style={{ fontSize: 11, color: '#6B7280' }}>{STATUS_LABELS[k]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
