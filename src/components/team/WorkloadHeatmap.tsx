'use client';

import type { MemberWorkload } from '@/types/index';

interface WorkloadHeatmapProps {
  members: MemberWorkload[];
  compact?: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  OWNER: '관리자',
  MEMBER: '멤버',
  VIEWER: '뷰어',
};

const STATUS_COLS = [
  { key: 'TODO' as const, label: 'Todo', color: '#3B82F6' },
  { key: 'IN_PROGRESS' as const, label: 'In Prog.', color: '#F59E0B' },
  { key: 'DONE' as const, label: 'Done', color: '#629584' },
];

export function WorkloadHeatmap({ members, compact = false }: WorkloadHeatmapProps) {
  if (members.length === 0) {
    return (
      <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 13, padding: '16px 0' }}>
        멤버 없음
      </div>
    );
  }

  const maxAssigned = Math.max(...members.map((m) => m.assigned), 1);

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '5px 8px', color: '#9CA3AF', fontWeight: 600, fontSize: 11, borderBottom: '1px solid #F3F4F6' }}>
              멤버
            </th>
            {!compact && (
              <th style={{ textAlign: 'center', padding: '5px 8px', color: '#9CA3AF', fontWeight: 600, fontSize: 11, borderBottom: '1px solid #F3F4F6' }}>
                담당
              </th>
            )}
            {STATUS_COLS.map((c) => (
              <th
                key={c.key}
                style={{ textAlign: 'center', padding: '5px 8px', fontSize: 11, fontWeight: 600, color: c.color, borderBottom: '1px solid #F3F4F6' }}
              >
                {c.label}
              </th>
            ))}
            {!compact && (
              <th style={{ textAlign: 'left', padding: '5px 8px', color: '#9CA3AF', fontWeight: 600, fontSize: 11, borderBottom: '1px solid #F3F4F6', minWidth: 80 }}>
                워크로드
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {members.map((m) => {
            const pct = Math.round((m.assigned / maxAssigned) * 100);
            return (
              <tr key={m.memberId} style={{ borderBottom: '1px solid #F9FAFB' }}>
                <td style={{ padding: '7px 8px' }}>
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
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 12, color: '#374151', lineHeight: 1.2 }}>
                        {m.displayName}
                      </div>
                      {!compact && (
                        <div style={{ fontSize: 10, color: '#9CA3AF' }}>{ROLE_LABELS[m.role] ?? m.role}</div>
                      )}
                    </div>
                  </div>
                </td>
                {!compact && (
                  <td style={{ textAlign: 'center', padding: '7px 8px', fontWeight: 700, color: '#374151' }}>
                    {m.assigned}
                  </td>
                )}
                {STATUS_COLS.map((c) => (
                  <td
                    key={c.key}
                    style={{
                      textAlign: 'center',
                      padding: '7px 8px',
                      fontWeight: 600,
                      color: (m.byStatus[c.key] ?? 0) > 0 ? c.color : '#D1D5DB',
                    }}
                  >
                    {m.byStatus[c.key] ?? 0}
                  </td>
                ))}
                {!compact && (
                  <td style={{ padding: '7px 8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div
                        style={{
                          flex: 1,
                          height: 6,
                          borderRadius: 3,
                          background: '#F3F4F6',
                          overflow: 'hidden',
                          minWidth: 50,
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            borderRadius: 3,
                            background: pct > 80 ? '#EF4444' : pct > 60 ? '#F59E0B' : '#629584',
                            width: `${pct}%`,
                          }}
                        />
                      </div>
                      <span style={{ fontSize: 10, color: '#9CA3AF', whiteSpace: 'nowrap' }}>{pct}%</span>
                    </div>
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
