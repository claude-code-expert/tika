'use client';

import type { CycleTimeDistribution } from '@/types/index';

interface CycleTimeAnalysisProps {
  distribution: CycleTimeDistribution[];
  average: number;
  median: number;
  height?: number;
}

export function CycleTimeAnalysis({
  distribution,
  average,
  median,
  height = 180,
}: CycleTimeAnalysisProps) {
  if (distribution.length === 0) {
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
        완료된 티켓 없음
      </div>
    );
  }

  const width = 500;
  const padL = 36;
  const padR = 16;
  const padT = 24;
  const padB = 28;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;

  const maxCount = Math.max(...distribution.map((d) => d.count), 1);
  const allDays = distribution.map((d) => d.days);
  const minDay = Math.min(...allDays);
  const maxDay = Math.max(...allDays);
  const span = Math.max(maxDay - minDay, 1);

  const barW = Math.max(4, (innerW / distribution.length) - 2);
  const xScale = (days: number) => padL + ((days - minDay) / span) * (innerW - barW);
  const yScale = (v: number) => padT + innerH - (v / maxCount) * innerH;

  return (
    <div>
      {/* Stats */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 11, color: '#9CA3AF' }}>평균</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#2C3E50' }}>{average}일</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#9CA3AF' }}>중앙값</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#629584' }}>{median}일</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: '#9CA3AF' }}>샘플</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#2C3E50' }}>
            {distribution.reduce((s, d) => s + d.count, 0)}
          </div>
        </div>
      </div>

      <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
        {/* Y grid */}
        {[0, Math.round(maxCount / 2), maxCount].map((v) => (
          <g key={v}>
            <line x1={padL} x2={padL + innerW} y1={yScale(v)} y2={yScale(v)} stroke="#F3F4F6" strokeWidth={1} />
            <text x={padL - 4} y={yScale(v) + 4} textAnchor="end" fontSize={9} fill="#9CA3AF">{v}</text>
          </g>
        ))}

        {/* Bars */}
        {distribution.map((d) => (
          <rect
            key={d.days}
            x={xScale(d.days)}
            y={yScale(d.count)}
            width={barW}
            height={innerH - (yScale(d.count) - padT)}
            rx={2}
            fill="#629584"
            fillOpacity={0.8}
          />
        ))}

        {/* Average line */}
        {average > 0 && average >= minDay && average <= maxDay && (
          <>
            <line
              x1={xScale(average) + barW / 2}
              x2={xScale(average) + barW / 2}
              y1={padT}
              y2={padT + innerH}
              stroke="#EF4444"
              strokeWidth={1.5}
              strokeDasharray="4 3"
            />
            <text x={xScale(average) + barW / 2 + 3} y={padT + 10} fontSize={9} fill="#EF4444">
              avg
            </text>
          </>
        )}

        {/* X labels */}
        {distribution.map((d) => (
          <text key={d.days} x={xScale(d.days) + barW / 2} y={height - 6} textAnchor="middle" fontSize={9} fill="#9CA3AF">
            {d.days}d
          </text>
        ))}
      </svg>
    </div>
  );
}
