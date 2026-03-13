'use client';

import { useState } from 'react';
import type { MemberWorkload, TicketWithMeta, TeamRole } from '@/types/index';
import { RoleBadge } from '@/components/ui/RoleBadge';
import { IssueTypeBadge, StatusBadge } from '@/components/ui/Chips';
import { Modal } from '@/components/ui/Modal';

interface MemberDetailCardProps {
  member: MemberWorkload;
  tickets: TicketWithMeta[];
}

export function MemberDetailCard({ member, tickets }: MemberDetailCardProps) {
  const [showModal, setShowModal] = useState(false);
  const memberTickets = tickets.filter(
    (t) =>
      t.assignees?.some((a) => a.id === member.memberId) ||
      t.assignee?.id === member.memberId,
  );

  const STATS = [
    { label: '할당',    value: String(member.assigned),            color: '#374151' },
    { label: '완료',    value: String(member.completed),           color: '#629584' },
    { label: '진행',    value: String(member.inProgress),          color: '#F59E0B' },
    { label: 'Workday', value: `${member.assigned * 2}d`,          color: '#6B7280' },
  ];

  return (
    <>
    <div
      onClick={() => setShowModal(true)}
      style={{
        background: '#fff',
        border: '1px solid #DFE1E6',
        borderRadius: 10,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 1px 3px rgba(0,0,0,.04)',
        cursor: 'pointer',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px', borderBottom: '1px solid #F3F4F6' }}>
        {/* Avatar — 44px has no matching Avatar size, kept inline */}
        <div
          style={{
            width: 44, height: 44, borderRadius: '50%',
            background: member.color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 700, color: '#fff', flexShrink: 0,
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
        <RoleBadge role={member.role as TeamRole} />
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderTop: '1px solid #DFE1E6', borderBottom: '1px solid #DFE1E6' }}>
        {STATS.map((s, idx) => (
          <div
            key={s.label}
            style={{ textAlign: 'center', padding: '10px 4px', borderRight: idx < 3 ? '1px solid #DFE1E6' : undefined }}
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
            const today = new Date().toISOString().slice(0, 10);
            const isOverdue = t.plannedEndDate && t.status !== 'DONE' && t.plannedEndDate < today;
            return (
              <div
                key={t.id}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderBottom: '1px solid #F3F4F6', fontSize: 12 }}
              >
                <IssueTypeBadge type={t.type} size={14} />
                <span style={{ flex: 1, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {t.title}
                </span>
                <StatusBadge status={t.status} />
                {t.plannedEndDate && (
                  <span style={{ fontSize: 10, color: isOverdue ? '#DC2626' : '#9CA3AF', fontWeight: isOverdue ? 700 : 400, flexShrink: 0, minWidth: 36, textAlign: 'right' }}>
                    {t.plannedEndDate.slice(5).replace('-', '/')}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>

    {/* Detail Modal */}
    <Modal
      isOpen={showModal}
      onClose={() => setShowModal(false)}
      maxWidth={560}
      maxHeight="80vh"
      headerContent={
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Avatar — 48px has no matching Avatar size, kept inline */}
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: member.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
            {member.displayName.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 18, color: '#2C3E50' }}>{member.displayName}</div>
            {member.email && (
              <div style={{ fontSize: 12, color: '#5A6B7F', marginTop: 2 }}>{member.email}</div>
            )}
          </div>
          <RoleBadge role={member.role as TeamRole} />
        </div>
      }
    >
      <div style={{ padding: '20px 20px 24px', overflowY: 'auto', flex: 1 }}>
        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', border: '1px solid #DFE1E6', borderRadius: 8, marginBottom: 20, overflow: 'hidden' }}>
          {STATS.map((s, idx) => (
            <div key={s.label} style={{ textAlign: 'center', padding: '10px 4px', borderRight: idx < 3 ? '1px solid #DFE1E6' : undefined }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* All tickets */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#2C3E50', marginBottom: 10 }}>
            담당 티켓 ({memberTickets.length}개)
          </div>
          {memberTickets.length === 0 ? (
            <div style={{ fontSize: 12, color: '#9BA8B4', textAlign: 'center', padding: '20px 0' }}>담당 티켓 없음</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {memberTickets.map((t) => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: '#F8F9FB', borderRadius: 8, fontSize: 12 }}>
                  <IssueTypeBadge type={t.type} size={14} />
                  <span style={{ flex: 1, fontWeight: 600, color: '#2C3E50', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.title}
                  </span>
                  <StatusBadge status={t.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
    </>
  );
}
