'use client';

import type { BurndownDataPoint } from '@/types/index';

interface BurndownChartProps {
  data: BurndownDataPoint[];
  height?: number;
}

export function BurndownChart({ data, height = 200 }: BurndownChartProps) {
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
  const padL = 32;
  const padR = 12;
  const padT = 8;
  const padB = 24;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;

  const maxVal = Math.max(...data.map((d) => d.remainingTickets), 1);
  const n = data.length;

  const xScale = (i: number) => padL + (i / Math.max(n - 1, 1)) * innerW;
  const yScale = (v: number) => padT + innerH - (v / maxVal) * innerH;

  const actualPath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'}${xScale(i).toFixed(1)},${yScale(d.remainingTickets).toFixed(1)}`)
    .join(' ');

  const idealPath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'}${xScale(i).toFixed(1)},${yScale(d.idealTickets).toFixed(1)}`)
    .join(' ');

  // Y axis ticks
  const yTicks = [0, Math.round(maxVal / 2), maxVal];

  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
        {/* Grid lines */}
        {yTicks.map((v, i) => (
          <line
            key={i}
            x1={padL}
            x2={padL + innerW}
            y1={yScale(v)}
            y2={yScale(v)}
            stroke="#E5E7EB"
            strokeWidth={1}
          />
        ))}

        {/* Y axis labels */}
        {yTicks.map((v, i) => (
          <text key={i} x={padL - 4} y={yScale(v) + 4} textAnchor="end" fontSize={9} fill="#9CA3AF">
            {v}
          </text>
        ))}

        {/* X axis labels (first and last) */}
        <text x={padL} y={height - 4} textAnchor="middle" fontSize={9} fill="#9CA3AF">
          {data[0].date.slice(5)}
        </text>
        <text x={padL + innerW} y={height - 4} textAnchor="middle" fontSize={9} fill="#9CA3AF">
          {data[data.length - 1].date.slice(5)}
        </text>

        {/* Ideal line (dashed) */}
        <path d={idealPath} fill="none" stroke="#9CA3AF" strokeWidth={1.5} strokeDasharray="4 3" />

        {/* Actual line */}
        <path d={actualPath} fill="none" stroke="#629584" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
