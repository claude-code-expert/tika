'use client';

import { PRIORITY_CONFIG } from '@/components/ui/Chips';

const PRIORITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const;
const STATUSES = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'DONE'] as const;

const STATUS_LABELS: Record<string, string> = {
  BACKLOG: 'Backlog',
  TODO: 'Todo',
  IN_PROGRESS: 'In Prog.',
  DONE: 'Done',
};

type MatrixData = Record<string, Record<string, number>>;

interface PriorityStatusMatrixProps {
  data: MatrixData;
}

export function PriorityStatusMatrix({ data }: PriorityStatusMatrixProps) {
  const totals: Record<string, number> = {};
  for (const p of PRIORITIES) {
    totals[p] = STATUSES.reduce((s, st) => s + (data[p]?.[st] ?? 0), 0);
  }

  const maxCell = Math.max(
    ...PRIORITIES.flatMap((p) => STATUSES.map((s) => data[p]?.[s] ?? 0)),
    1,
  );

  return (
    <div style={{ overflowX: 'auto' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: 12,
        }}
      >
        <thead>
          <tr>
            <th
              style={{
                textAlign: 'left',
                padding: '6px 8px',
                color: '#9CA3AF',
                fontWeight: 600,
                fontSize: 11,
                borderBottom: '1px solid #F3F4F6',
              }}
            >
              우선순위
            </th>
            {STATUSES.map((s) => (
              <th
                key={s}
                style={{
                  textAlign: 'center',
                  padding: '6px 8px',
                  color: '#9CA3AF',
                  fontWeight: 600,
                  fontSize: 11,
                  borderBottom: '1px solid #F3F4F6',
                }}
              >
                {STATUS_LABELS[s]}
              </th>
            ))}
            <th
              style={{
                textAlign: 'center',
                padding: '6px 8px',
                color: '#9CA3AF',
                fontWeight: 600,
                fontSize: 11,
                borderBottom: '1px solid #F3F4F6',
              }}
            >
              합계
            </th>
          </tr>
        </thead>
        <tbody>
          {PRIORITIES.map((p) => (
            <tr key={p} style={{ borderBottom: '1px solid #F9FAFB' }}>
              <td
                style={{
                  padding: '8px 8px',
                  fontWeight: 600,
                  fontSize: 11,
                  color: PRIORITY_CONFIG[p].color,
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ fontWeight: 800, marginRight: 3, letterSpacing: -0.5 }}>
                  {PRIORITY_CONFIG[p].icon}
                </span>
                {PRIORITY_CONFIG[p].label}
              </td>
              {STATUSES.map((s) => {
                const val = data[p]?.[s] ?? 0;
                const intensity = val / maxCell;
                return (
                  <td
                    key={s}
                    style={{
                      textAlign: 'center',
                      padding: '8px 8px',
                      fontSize: 13,
                      fontWeight: val > 0 ? 600 : 400,
                      color: val > 0 ? '#374151' : '#D1D5DB',
                      background:
                        val > 0 ? `rgba(98, 149, 132, ${0.1 + intensity * 0.3})` : 'transparent',
                      borderRadius: 4,
                    }}
                  >
                    {val > 0 ? val : '–'}
                  </td>
                );
              })}
              <td
                style={{
                  textAlign: 'center',
                  padding: '8px 8px',
                  fontWeight: 700,
                  fontSize: 13,
                  color: '#2C3E50',
                }}
              >
                {totals[p]}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
