'use client';

import { useState } from 'react';
import { BurndownChart } from './BurndownChart';
import type { BurndownDataPoint } from '@/types/index';

type Period = 'lastWeek' | 'thisMonth' | 'lastMonth';

interface BurndownPeriodChartProps {
  lastWeek: BurndownDataPoint[];
  thisMonth: BurndownDataPoint[];
  lastMonth: BurndownDataPoint[];
}

const PERIOD_LABELS: Record<Period, string> = {
  lastWeek: '지난주',
  thisMonth: '이번달',
  lastMonth: '지난달',
};

export function BurndownPeriodChart({ lastWeek, thisMonth, lastMonth }: BurndownPeriodChartProps) {
  const [period, setPeriod] = useState<Period>('thisMonth');

  const dataMap: Record<Period, BurndownDataPoint[]> = { lastWeek, thisMonth, lastMonth };
  const data = dataMap[period];

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {(Object.keys(PERIOD_LABELS) as Period[]).map((key) => (
          <button
            key={key}
            onClick={() => setPeriod(key)}
            style={{
              padding: '4px 12px',
              fontSize: 11,
              fontWeight: period === key ? 700 : 500,
              color: period === key ? '#fff' : '#5A6B7F',
              background: period === key ? '#629584' : '#F1F3F6',
              border: 'none',
              borderRadius: 5,
              cursor: 'pointer',
              transition: 'all .15s',
            }}
          >
            {PERIOD_LABELS[key]}
          </button>
        ))}
      </div>
      <BurndownChart data={data} storyPointsTotal={data[0]?.remainingPoints ?? 0} />
    </div>
  );
}
