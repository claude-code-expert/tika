'use client';

import type { MemberWorkload, TicketWithMeta } from '@/types/index';

interface MemberDetailCardProps {
  member: MemberWorkload;
  tickets: TicketWithMeta[];
}

const TYPE_BADGE: Record<string, { bg: string; color: string; abbr: string }> = {
  GOAL:    { bg: '#E0E7FF', color: '#4338CA', abbr: 'G' },
  STORY:   { bg: '#DBEAFE', color: '#1D4ED8', abbr: 'S' },
  FEATURE: { bg: '#D1FAE5', color: '#065F46', abbr: 'F' },
  TASK:    { bg: '#F3F4F6', color: '#6B7280', abbr: 'T' },
};

const ROLE_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  OWNER:  { bg: '#E8F4F0', color: '#629584', label: 'Owner' },
  MEMBER: { bg: '#EDE9FE', color: '#7C3AED', label: 'Member' },
  VIEWER: { bg: '#F3F4F6', color: '#6B7280', label: 'Viewer' },
};

const STATUS_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  BACKLOG:     { bg: '#F3F4F6', color: '#6B7280', label: 'Backlog' },
  TODO:        { bg: '#DBEAFE', color: '#1E40AF', label: 'Todo' },
  IN_PROGRESS: { bg: '#FEF3C7', color: '#92400E', label: 'In Progress' },
  DONE:        { bg: '#D1FAE5', color: '#065F46', label: 'Done' },
};

export function MemberDetailCard({ member, tickets }: MemberDetailCardProps) {
  const memberTickets = tickets.filter(
    (t) =>
      t.assignees?.some((a) => a.id === member.memberId) ||
      t.assignee?.id === member.memberId,
  );

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #DFE1E6',
        borderRadius: 10,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 1px 3px rgba(0,0,0,.04)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px', borderBottom: '1px solid #F3F4F6' }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: member.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            fontWeight: 700,
            color: '#fff',
            flexShrink: 0,
          }}
        >
          {member.displayName.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#2C3E50' }}>{member.displayName}</div>
          {member.email && (
            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {member.email}
            </div>
          )}
        </div>
        {(() => {
          const rb = ROLE_BADGE[member.role] ?? ROLE_BADGE.VIEWER;
          return (
            <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: rb.bg, color: rb.color, flexShrink: 0 }}>
              {rb.label}
            </span>
          );
        })()}
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderTop: '1px solid #DFE1E6', borderBottom: '1px solid #DFE1E6' }}>
        {[
          { label: '할당',    value: String(member.assigned),            color: '#374151' },
          { label: '완료',    value: String(member.completed),           color: '#629584' },
          { label: '진행',    value: String(member.inProgress),          color: '#F59E0B' },
          { label: 'Workday', value: `${member.assigned * 2}d`,          color: '#6B7280' },
        ].map((s, idx) => (
          <div
            key={s.label}
            style={{
              textAlign: 'center',
              padding: '10px 4px',
              borderRight: idx < 3 ? '1px solid #DFE1E6' : undefined,
            }}
          >
            <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Ticket list */}
      {memberTickets.length > 0 && (
        <div style={{ maxHeight: 200, overflowY: 'auto' }}>
          {memberTickets.slice(0, 8).map((t) => {
            const typeBadge   = TYPE_BADGE[t.type]   ?? TYPE_BADGE.TASK;
            const statusBadge = STATUS_BADGE[t.status] ?? STATUS_BADGE.BACKLOG;
            const today = new Date().toISOString().slice(0, 10);
            const isOverdue = t.plannedEndDate && t.status !== 'DONE' && t.plannedEndDate < today;
            return (
              <div
                key={t.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 12px',
                  borderBottom: '1px solid #F3F4F6',
                  fontSize: 12,
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '1px 5px',
                    borderRadius: 3,
                    background: typeBadge.bg,
                    color: typeBadge.color,
                    flexShrink: 0,
                  }}
                >
                  {typeBadge.abbr}
                </span>
                <span
                  style={{
                    flex: 1,
                    color: '#374151',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {t.title}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    padding: '1px 6px',
                    borderRadius: 3,
                    background: statusBadge.bg,
                    color: statusBadge.color,
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {statusBadge.label}
                </span>
                {t.plannedEndDate && (
                  <span
                    style={{
                      fontSize: 10,
                      color: isOverdue ? '#DC2626' : '#9CA3AF',
                      fontWeight: isOverdue ? 700 : 400,
                      flexShrink: 0,
                      minWidth: 36,
                      textAlign: 'right',
                    }}
                  >
                    {t.plannedEndDate.slice(5).replace('-', '/')}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
