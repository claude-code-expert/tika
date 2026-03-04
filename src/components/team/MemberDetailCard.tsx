'use client';

import type { MemberWorkload, TicketWithMeta } from '@/types/index';
import { RoleBadge } from '@/components/ui/RoleBadge';

interface MemberDetailCardProps {
  member: MemberWorkload;
  tickets: TicketWithMeta[];
}

const STATUS_LABEL: Record<string, string> = {
  BACKLOG: 'Backlog',
  TODO: 'Todo',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
};

const STATUS_COLOR: Record<string, string> = {
  BACKLOG: '#9CA3AF',
  TODO: '#3B82F6',
  IN_PROGRESS: '#F59E0B',
  DONE: '#629584',
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
        background: 'var(--color-card-bg)',
        border: '1px solid var(--color-border)',
        borderRadius: 10,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#2C3E50' }}>{member.displayName}</div>
          <RoleBadge role={member.role} size="sm" />
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {[
          { label: '담당', value: member.assigned, color: '#374151' },
          { label: '진행', value: member.inProgress, color: '#F59E0B' },
          { label: '완료', value: member.completed, color: '#629584' },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              textAlign: 'center',
              padding: '8px 6px',
              borderRadius: 6,
              background: '#F9FAFB',
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 10, color: '#9CA3AF' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Ticket list */}
      {memberTickets.length > 0 && (
        <div style={{ maxHeight: 160, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {memberTickets.slice(0, 8).map((t) => (
            <div
              key={t.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 6px',
                borderRadius: 5,
                background: '#F9FAFB',
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: STATUS_COLOR[t.status] ?? '#9CA3AF',
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: 11,
                  color: '#374151',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flex: 1,
                }}
              >
                {t.title}
              </span>
              <span style={{ fontSize: 10, color: '#9CA3AF', whiteSpace: 'nowrap' }}>
                {STATUS_LABEL[t.status]}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
