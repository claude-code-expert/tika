'use client';

import type { CfdDataPoint } from '@/types/index';

interface DailyLogTableProps {
  data: CfdDataPoint[];
  maxRows?: number;
}

export function DailyLogTable({ data, maxRows = 14 }: DailyLogTableProps) {
  if (data.length === 0) {
    return (
      <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13 }}>
        데이터 없음
      </div>
    );
  }

  // Compute daily deltas
  const rows = [...data].slice(-maxRows).map((d, i, arr) => {
    const prev = arr[i - 1];
    const doneDelta = prev ? d.done - prev.done : 0;
    const totalToday = d.backlog + d.todo + d.inProgress + d.done;
    const totalPrev = prev ? prev.backlog + prev.todo + prev.inProgress + prev.done : totalToday;
    const addedDelta = Math.max(0, totalToday - totalPrev);
    const remaining = d.backlog + d.todo + d.inProgress;
    const absorptionRate =
      addedDelta > 0 ? Math.round((doneDelta / Math.max(addedDelta, 1)) * 100) : null;

    return { date: d.date, completed: doneDelta, added: addedDelta, remaining, absorptionRate };
  });

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr>
            {['날짜', '완료', '추가', '잔여', '흡수율'].map((h) => (
              <th
                key={h}
                style={{
                  textAlign: h === '날짜' ? 'left' : 'right',
                  padding: '5px 8px',
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#9CA3AF',
                  borderBottom: '1px solid #F3F4F6',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.date} style={{ borderBottom: '1px solid #F9FAFB' }}>
              <td style={{ padding: '5px 8px', color: '#374151', fontSize: 11 }}>{r.date.slice(5)}</td>
              <td style={{ padding: '5px 8px', textAlign: 'right', color: r.completed > 0 ? '#629584' : '#D1D5DB', fontWeight: r.completed > 0 ? 600 : 400 }}>
                {r.completed > 0 ? `+${r.completed}` : '–'}
              </td>
              <td style={{ padding: '5px 8px', textAlign: 'right', color: r.added > 0 ? '#3B82F6' : '#D1D5DB', fontWeight: r.added > 0 ? 600 : 400 }}>
                {r.added > 0 ? `+${r.added}` : '–'}
              </td>
              <td style={{ padding: '5px 8px', textAlign: 'right', color: '#374151', fontWeight: 600 }}>
                {r.remaining}
              </td>
              <td style={{ padding: '5px 8px', textAlign: 'right', color: r.absorptionRate !== null && r.absorptionRate >= 100 ? '#629584' : r.absorptionRate !== null ? '#F59E0B' : '#D1D5DB' }}>
                {r.absorptionRate !== null ? `${r.absorptionRate}%` : '–'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
