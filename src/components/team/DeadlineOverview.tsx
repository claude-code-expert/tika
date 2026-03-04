'use client';

import type { TicketWithMeta } from '@/types/index';

interface DeadlineOverviewProps {
  overdueTickets: TicketWithMeta[];
  upcomingTickets: TicketWithMeta[];
}

function daysDiff(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr);
  return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function DeadlineOverview({ overdueTickets, upcomingTickets }: DeadlineOverviewProps) {
  const total = overdueTickets.length + upcomingTickets.length;

  return (
    <div>
      {/* Stats row */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
        <div
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: 8,
            background: overdueTickets.length > 0 ? '#FEF2F2' : '#F0FDF4',
            border: `1px solid ${overdueTickets.length > 0 ? '#FCA5A5' : '#86EFAC'}`,
          }}
        >
          <div style={{ fontSize: 20, fontWeight: 700, color: overdueTickets.length > 0 ? '#DC2626' : '#16A34A' }}>
            {overdueTickets.length}
          </div>
          <div style={{ fontSize: 11, color: '#6B7280' }}>기한 초과</div>
        </div>
        <div
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: 8,
            background: '#FFFBEB',
            border: '1px solid #FCD34D',
          }}
        >
          <div style={{ fontSize: 20, fontWeight: 700, color: '#B45309' }}>{upcomingTickets.length}</div>
          <div style={{ fontSize: 11, color: '#6B7280' }}>3일 내 마감</div>
        </div>
        <div
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: 8,
            background: '#F9FAFB',
            border: '1px solid #E5E7EB',
          }}
        >
          <div style={{ fontSize: 20, fontWeight: 700, color: '#374151' }}>{total}</div>
          <div style={{ fontSize: 11, color: '#6B7280' }}>주의 필요</div>
        </div>
      </div>

      {/* Ticket list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
        {overdueTickets.slice(0, 5).map((t) => (
          <div
            key={t.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 10px',
              borderRadius: 6,
              background: '#FEF2F2',
              border: '1px solid #FCA5A5',
            }}
          >
            <span style={{ fontSize: 10, color: '#DC2626' }}>⚠</span>
            <span style={{ fontSize: 12, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#374151' }}>
              {t.title}
            </span>
            <span style={{ fontSize: 10, color: '#DC2626', fontWeight: 600, whiteSpace: 'nowrap' }}>
              {t.dueDate}
            </span>
          </div>
        ))}
        {upcomingTickets.slice(0, 5).map((t) => {
          const diff = t.dueDate ? daysDiff(t.dueDate) : null;
          return (
            <div
              key={t.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 10px',
                borderRadius: 6,
                background: '#FFFBEB',
                border: '1px solid #FCD34D',
              }}
            >
              <span style={{ fontSize: 10, color: '#B45309' }}>📅</span>
              <span style={{ fontSize: 12, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#374151' }}>
                {t.title}
              </span>
              <span style={{ fontSize: 10, color: '#B45309', fontWeight: 600, whiteSpace: 'nowrap' }}>
                {diff !== null && diff === 0 ? '오늘' : diff !== null ? `D-${diff}` : t.dueDate}
              </span>
            </div>
          );
        })}
        {total === 0 && (
          <div style={{ textAlign: 'center', color: '#9CA3AF', fontSize: 13, padding: '12px 0' }}>
            기한 임박 티켓 없음
          </div>
        )}
      </div>
    </div>
  );
}
