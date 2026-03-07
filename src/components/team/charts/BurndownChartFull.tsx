'use client';

import { useState } from 'react';
import type { BurndownDataPoint } from '@/types/index';

interface BurndownChartFullProps {
  data: BurndownDataPoint[];
  storyPointsTotal: number;
}

export function BurndownChartFull({ data, storyPointsTotal }: BurndownChartFullProps) {
  const [mode, setMode] = useState<'tickets' | 'points'>('tickets');

  const height = 280;
  const width = 700;
  const padL = 48;
  const padR = 24;
  const padT = 24;
  const padB = 40;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;

  const getValue = (d: BurndownDataPoint) =>
    mode === 'tickets' ? d.remainingTickets : d.remainingPoints;
  const getIdeal = (d: BurndownDataPoint) =>
    mode === 'tickets' ? d.idealTickets : Math.round((d.idealTickets / Math.max(data[0]?.remainingTickets || 1, 1)) * storyPointsTotal);

  const maxVal = data.length > 0 ? Math.max(...data.map(getValue), 1) : 1;
  const n = data.length;

  const xScale = (i: number) => padL + (i / Math.max(n - 1, 1)) * innerW;
  const yScale = (v: number) => padT + innerH - (v / maxVal) * innerH;

  const actualPath =
    data.length > 0
      ? data
          .map(
            (d, i) =>
              `${i === 0 ? 'M' : 'L'}${xScale(i).toFixed(1)},${yScale(getValue(d)).toFixed(1)}`,
          )
          .join(' ')
      : '';

  const idealPath =
    data.length > 0
      ? data
          .map(
            (d, i) =>
              `${i === 0 ? 'M' : 'L'}${xScale(i).toFixed(1)},${yScale(getIdeal(d)).toFixed(1)}`,
          )
          .join(' ')
      : '';

  const yTicks = Array.from({ length: 5 }, (_, i) => Math.round((maxVal / 4) * i));

  // Show every Nth date label
  const labelStep = Math.max(1, Math.floor(n / 7));
  const visibleLabels = data.filter((_, i) => i % labelStep === 0 || i === n - 1);

  if (data.length === 0) {
    return (
      <div
        style={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-text-muted)',
          fontSize: 14,
        }}
      >
        스프린트를 선택하거나 데이터가 없습니다
      </div>
    );
  }

  return (
    <div>
      {/* Toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {(['tickets', 'points'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              padding: '4px 12px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              border: '1px solid',
              borderColor: mode === m ? '#629584' : '#E5E7EB',
              background: mode === m ? '#629584' : '#fff',
              color: mode === m ? '#fff' : '#6B7280',
              cursor: 'pointer',
            }}
          >
            {m === 'tickets' ? '티켓 수' : '스토리 포인트'}
          </button>
        ))}
      </div>

      <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
        {/* Grid */}
        {yTicks.map((v) => (
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
        {yTicks.map((v) => (
          <text key={v} x={padL - 6} y={yScale(v) + 4} textAnchor="end" fontSize={10} fill="#9CA3AF">
            {v}
          </text>
        ))}

        {/* X labels */}
        {visibleLabels.map((d, i) => {
          const origIdx = data.indexOf(d);
          return (
            <text key={i} x={xScale(origIdx)} y={height - 8} textAnchor="middle" fontSize={9} fill="#9CA3AF">
              {d.date.slice(5)}
            </text>
          );
        })}

        {/* Area fill under actual */}
        <path
          d={`${actualPath} L${xScale(n - 1)},${padT + innerH} L${padL},${padT + innerH} Z`}
          fill="#629584"
          fillOpacity={0.08}
        />

        {/* Ideal dashed line */}
        <path d={idealPath} fill="none" stroke="#D1D5DB" strokeWidth={1.5} strokeDasharray="5 4" />

        {/* Actual line */}
        <path d={actualPath} fill="none" stroke="#629584" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

        {/* Data points */}
        {data.map((d, i) => (
          <circle key={i} cx={xScale(i)} cy={yScale(getValue(d))} r={3} fill="#629584" />
        ))}

        {/* Legend */}
        <line x1={padL + 4} x2={padL + 20} y1={padT - 8} y2={padT - 8} stroke="#629584" strokeWidth={2.5} />
        <text x={padL + 24} y={padT - 4} fontSize={10} fill="#374151">실제 남은 {mode === 'tickets' ? '티켓' : 'SP'}</text>
        <line x1={padL + 120} x2={padL + 136} y1={padT - 8} y2={padT - 8} stroke="#D1D5DB" strokeWidth={1.5} strokeDasharray="5 4" />
        <text x={padL + 140} y={padT - 4} fontSize={10} fill="#374151">이상적 번다운</text>
      </svg>
    </div>
  );
}
