'use client';

import type { VelocitySprint } from '@/types/index';

interface VelocityChartProps {
  sprints: VelocitySprint[];
  height?: number;
}

export function VelocityChart({ sprints, height = 180 }: VelocityChartProps) {
  if (sprints.length === 0) {
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
        완료된 스프린트 없음
      </div>
    );
  }

  const barH = 24;
  const gap = 14;
  const padL = 120;
  const padR = 60;
  const padT = 12;
  const totalH = padT + sprints.length * (barH + gap) + 16;
  const width = 500;
  const innerW = width - padL - padR;

  const maxPoints = Math.max(...sprints.map((s) => Math.max(s.completedPoints, s.plannedPoints)), 1);
  const xScale = (v: number) => (v / maxPoints) * innerW;

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${totalH}`} style={{ display: 'block' }}>
      {sprints.map((s, i) => {
        const y = padT + i * (barH + gap);
        const plannedW = xScale(s.plannedPoints);
        const completedW = xScale(s.completedPoints);
        const barHalf = barH / 2 - 2;

        return (
          <g key={s.sprintId}>
            {/* Sprint name */}
            <text
              x={padL - 8}
              y={y + barH / 2 + 4}
              textAnchor="end"
              fontSize={11}
              fill="#374151"
              style={{ fontWeight: 500 }}
            >
              {s.name.length > 14 ? s.name.slice(0, 13) + '…' : s.name}
            </text>

            {/* Planned bar (background) */}
            <rect x={padL} y={y + 2} width={Math.max(plannedW, 1)} height={barHalf} rx={3} fill="#E5E7EB" />
            {/* Completed bar */}
            <rect x={padL} y={y + barHalf + 4} width={Math.max(completedW, 1)} height={barHalf} rx={3} fill="#629584" />

            {/* Labels */}
            <text x={padL + plannedW + 6} y={y + barHalf / 2 + 4} fontSize={9} fill="#9CA3AF">
              {s.plannedPoints}pt 계획
            </text>
            <text x={padL + completedW + 6} y={y + barHalf + 4 + barHalf / 2 + 4} fontSize={9} fill="#629584">
              {s.completedPoints}pt 완료
            </text>
          </g>
        );
      })}

      {/* Legend */}
      <rect x={padL} y={totalH - 14} width={12} height={8} rx={2} fill="#E5E7EB" />
      <text x={padL + 16} y={totalH - 6} fontSize={9} fill="#9CA3AF">계획</text>
      <rect x={padL + 55} y={totalH - 14} width={12} height={8} rx={2} fill="#629584" />
      <text x={padL + 71} y={totalH - 6} fontSize={9} fill="#629584">완료</text>
    </svg>
  );
}
