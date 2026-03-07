'use client';

import type { MemberWorkload } from '@/types/index';

interface WorkloadHeatmapProps {
  members: MemberWorkload[];
  compact?: boolean;
}

const ROLE_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  OWNER:  { bg: '#E8F4F0', color: '#629584', label: 'Owner' },
  MEMBER: { bg: '#EDE9FE', color: '#7C3AED', label: 'Member' },
  VIEWER: { bg: '#F3F4F6', color: '#6B7280', label: 'Viewer' },
};

const STATUS_COLS = [
  { key: 'TODO' as const, label: 'Todo', color: '#3B82F6' },
  { key: 'IN_PROGRESS' as const, label: '진행중', color: '#F59E0B' },
  { key: 'DONE' as const, label: '완료', color: '#629584' },
];

function loadLabel(pct: number, assigned: number): { text: string; color: string } {
  if (assigned === 0) return { text: '여유', color: '#9CA3AF' };
  if (pct >= 80)      return { text: '과중', color: '#DC2626' };
  if (pct >= 60)      return { text: '보통', color: '#F59E0B' };
  return              { text: '적정', color: '#629584' };
}

export function WorkloadHeatmap({ members, compact = false }: WorkloadHeatmapProps) {
  if (members.length === 0) {
    return (
      <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 13, padding: '16px 0' }}>
        멤버 없음
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '5px 8px', color: '#9CA3AF', fontWeight: 600, fontSize: 11, borderBottom: '2px solid #DFE1E6' }}>
              멤버
            </th>
            {!compact && (
              <th style={{ textAlign: 'left', padding: '5px 8px', color: '#9CA3AF', fontWeight: 600, fontSize: 11, borderBottom: '2px solid #DFE1E6' }}>
                역할
              </th>
            )}
            {!compact && (
              <th style={{ textAlign: 'center', padding: '5px 8px', color: '#9CA3AF', fontWeight: 600, fontSize: 11, borderBottom: '2px solid #DFE1E6' }}>
                할당
              </th>
            )}
            {STATUS_COLS.map((c) => (
              <th
                key={c.key}
                style={{ textAlign: 'center', padding: '5px 8px', fontSize: 11, fontWeight: 600, color: c.color, borderBottom: '2px solid #DFE1E6' }}
              >
                {c.label}
              </th>
            ))}
            <th style={{ textAlign: 'center', padding: '5px 8px', fontSize: 11, fontWeight: 600, color: '#DC2626', borderBottom: '2px solid #DFE1E6' }}>
              일정초과
            </th>
            {!compact && (
              <th style={{ textAlign: 'left', padding: '5px 8px', color: '#9CA3AF', fontWeight: 600, fontSize: 11, borderBottom: '2px solid #DFE1E6', minWidth: 120 }}>
                소화율
              </th>
            )}
            {!compact && (
              <th style={{ textAlign: 'center', padding: '5px 8px', color: '#9CA3AF', fontWeight: 600, fontSize: 11, borderBottom: '2px solid #DFE1E6' }}>
                부하
              </th>
            )}
            {!compact && (
              <th style={{ textAlign: 'center', padding: '5px 8px', color: '#9CA3AF', fontWeight: 600, fontSize: 11, borderBottom: '2px solid #DFE1E6' }}>
                Workday
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {members.map((m) => {
            const pct = m.assigned > 0 ? Math.round(m.completed / m.assigned * 100) : 0;
            const load = loadLabel(pct, m.assigned);
            const role = ROLE_BADGE[m.role] ?? ROLE_BADGE.VIEWER;
            return (
              <tr key={m.memberId} style={{ borderBottom: '1px solid #F3F4F6' }}>
                <td style={{ padding: '8px 8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: m.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 10,
                        fontWeight: 700,
                        color: '#fff',
                        flexShrink: 0,
                      }}
                    >
                      {m.displayName.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontWeight: 600, fontSize: 12, color: '#374151' }}>{m.displayName}</span>
                  </div>
                </td>
                {!compact && (
                  <td style={{ padding: '8px 8px' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: role.bg, color: role.color }}>
                      {role.label}
                    </span>
                  </td>
                )}
                {!compact && (
                  <td style={{ textAlign: 'center', padding: '8px 8px', fontWeight: 700, color: '#374151' }}>
                    {m.assigned}
                  </td>
                )}
                {STATUS_COLS.map((c) => (
                  <td
                    key={c.key}
                    style={{
                      textAlign: 'center',
                      padding: '8px 8px',
                      fontWeight: 600,
                      color: (m.byStatus[c.key] ?? 0) > 0 ? c.color : '#D1D5DB',
                    }}
                  >
                    {m.byStatus[c.key] ?? 0}
                  </td>
                ))}
                <td
                  style={{
                    textAlign: 'center',
                    padding: '8px 8px',
                    fontWeight: 700,
                    color: m.overdue > 0 ? '#DC2626' : '#D1D5DB',
                  }}
                >
                  {m.overdue}
                </td>
                {!compact && (
                  <td style={{ padding: '8px 8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ flex: 1, height: 8, borderRadius: 4, background: '#F3F4F6', overflow: 'hidden', minWidth: 80 }}>
                        <div
                          style={{
                            height: '100%',
                            borderRadius: 4,
                            background: pct >= 80 ? '#EF4444' : pct >= 60 ? '#F59E0B' : '#629584',
                            width: `${pct}%`,
                          }}
                        />
                      </div>
                      <span style={{ fontSize: 11, color: '#9CA3AF', whiteSpace: 'nowrap', minWidth: 30 }}>{pct}%</span>
                    </div>
                  </td>
                )}
                {!compact && (
                  <td style={{ textAlign: 'center', padding: '8px 8px', fontWeight: 700, color: load.color, whiteSpace: 'nowrap' }}>
                    {load.text}
                  </td>
                )}
                {!compact && (
                  <td style={{ textAlign: 'center', padding: '8px 8px', fontWeight: 700, color: '#374151', whiteSpace: 'nowrap' }}>
                    {m.assigned * 2}d
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
