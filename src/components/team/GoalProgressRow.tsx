'use client';

import type { TicketWithMeta } from '@/types/index';

interface GoalProgressRowProps {
  goals: TicketWithMeta[];
  allTickets: TicketWithMeta[];
}

export function GoalProgressRow({ goals, allTickets }: GoalProgressRowProps) {
  if (goals.length === 0) {
    return (
      <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 13, padding: '16px 0' }}>
        Goal 티켓 없음
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {goals.slice(0, 5).map((goal) => {
        // Count child tickets (any ticket with this goal's issueId relationship)
        // For simplicity: count DONE vs total tickets under same issue
        const related = allTickets.filter((t) => t.issueId === goal.issueId && t.id !== goal.id);
        const done = related.filter((t) => t.status === 'DONE').length;
        const total = related.length;
        const pct = total > 0 ? Math.round((done / total) * 100) : (goal.status === 'DONE' ? 100 : 0);

        return (
          <div
            key={goal.id}
            style={{
              padding: '10px 14px',
              borderRadius: 8,
              background: 'var(--color-card-bg)',
              border: '1px solid var(--color-border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 16,
                    height: 16,
                    borderRadius: 3,
                    fontSize: 9,
                    fontWeight: 700,
                    color: '#fff',
                    background: '#8B5CF6',
                  }}
                >
                  G
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#374151',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: 200,
                  }}
                >
                  {goal.title}
                </span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: pct >= 100 ? '#629584' : '#374151' }}>
                {pct}%
              </span>
            </div>
            {/* Progress bar */}
            <div style={{ height: 6, borderRadius: 3, background: '#F3F4F6', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  borderRadius: 3,
                  background: pct >= 100 ? '#629584' : '#8B5CF6',
                  width: `${pct}%`,
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
            <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 4 }}>
              {done}/{total} 태스크 완료
            </div>
          </div>
        );
      })}
    </div>
  );
}
