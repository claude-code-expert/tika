'use client';

interface TrendPoint {
  date: string;
  created: number;
  resolved: number;
}

interface TrendChartProps {
  data: TrendPoint[];
  height?: number;
}

export function TrendChart({ data, height = 120 }: TrendChartProps) {
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

  const width = 400;
  const padL = 32;
  const padR = 12;
  const padT = 12;
  const padB = 24;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;

  const maxVal = Math.max(...data.map((d) => Math.max(d.created, d.resolved)), 1);
  const n = data.length;

  const xScale = (i: number) => padL + (i / Math.max(n - 1, 1)) * innerW;
  const yScale = (v: number) => padT + innerH - (v / maxVal) * innerH;

  const createdPath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'}${xScale(i).toFixed(1)},${yScale(d.created).toFixed(1)}`)
    .join(' ');

  const resolvedPath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'}${xScale(i).toFixed(1)},${yScale(d.resolved).toFixed(1)}`)
    .join(' ');

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
      {/* Grid */}
      {[0, Math.round(maxVal / 2), maxVal].map((v) => (
        <line
          key={v}
          x1={padL}
          x2={padL + innerW}
          y1={yScale(v)}
          y2={yScale(v)}
          stroke="#F3F4F6"
          strokeWidth={1}
        />
      ))}

      {/* Y labels */}
      {[0, maxVal].map((v) => (
        <text key={v} x={padL - 4} y={yScale(v) + 4} textAnchor="end" fontSize={9} fill="#9CA3AF">
          {v}
        </text>
      ))}

      {/* X labels */}
      <text x={padL} y={height - 4} textAnchor="middle" fontSize={9} fill="#9CA3AF">
        {data[0].date.slice(5)}
      </text>
      <text x={padL + innerW} y={height - 4} textAnchor="middle" fontSize={9} fill="#9CA3AF">
        {data[n - 1].date.slice(5)}
      </text>

      {/* Created line (blue) */}
      <path d={createdPath} fill="none" stroke="#3B82F6" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />

      {/* Resolved line (green) */}
      <path d={resolvedPath} fill="none" stroke="#629584" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />

      {/* Legend */}
      <line x1={padL + 4} x2={padL + 16} y1={padT + 4} y2={padT + 4} stroke="#3B82F6" strokeWidth={1.5} />
      <text x={padL + 20} y={padT + 8} fontSize={9} fill="#374151">생성</text>
      <line x1={padL + 50} x2={padL + 62} y1={padT + 4} y2={padT + 4} stroke="#629584" strokeWidth={1.5} />
      <text x={padL + 66} y={padT + 8} fontSize={9} fill="#374151">완료</text>
    </svg>
  );
}
