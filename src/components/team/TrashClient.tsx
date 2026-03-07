'use client';

import { useState } from 'react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { TicketWithMeta } from '@/types/index';

interface TrashClientProps {
  initialTickets: TicketWithMeta[];
}

const PRIORITY_LABEL: Record<string, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
};

const PRIORITY_COLOR: Record<string, string> = {
  LOW: '#6B7280',
  MEDIUM: '#F59E0B',
  HIGH: '#EF4444',
  CRITICAL: '#7C3AED',
};

const STATUS_LABEL: Record<string, string> = {
  BACKLOG: 'Backlog',
  TODO: 'Todo',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
};

const TYPE_LABEL: Record<string, string> = {
  GOAL: 'Goal',
  STORY: 'Story',
  FEATURE: 'Feature',
  TASK: 'Task',
};

export function TrashClient({ initialTickets }: TrashClientProps) {
  const [tickets, setTickets] = useState<TicketWithMeta[]>(initialTickets);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [loading, setLoading] = useState<number | null>(null);

  async function handlePermanentDelete(id: number) {
    setLoading(id);
    try {
      const res = await fetch(`/api/tickets/trash/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setTickets((prev) => prev.filter((t) => t.id !== id));
      }
    } finally {
      setLoading(null);
      setConfirmId(null);
    }
  }

  if (tickets.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          minHeight: 320,
          color: '#8993A4',
          fontSize: 14,
          gap: 12,
        }}
      >
        <svg
          width={48}
          height={48}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ opacity: 0.4 }}
        >
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6" />
          <path d="M14 11v6" />
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
        </svg>
        <p>휴지통이 비어있습니다</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 32px', maxWidth: 900 }}>
      <h1
        style={{
          fontSize: 18,
          fontWeight: 600,
          color: '#2C3E50',
          marginBottom: 8,
        }}
      >
        휴지통
      </h1>
      <p style={{ fontSize: 13, color: '#8993A4', marginBottom: 24 }}>
        삭제된 티켓 {tickets.length}개 — 영구 삭제하면 복구할 수 없습니다.
      </p>

      <div
        style={{
          border: '1px solid #DFE1E6',
          borderRadius: 8,
          overflow: 'hidden',
          background: '#fff',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 80px 80px 90px 100px',
            padding: '10px 16px',
            background: '#F8F9FB',
            borderBottom: '1px solid #DFE1E6',
            fontSize: 11,
            fontWeight: 600,
            color: '#8993A4',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          <span>제목</span>
          <span>유형</span>
          <span>우선순위</span>
          <span>상태</span>
          <span />
        </div>

        {tickets.map((ticket, idx) => (
          <div
            key={ticket.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 80px 80px 90px 100px',
              padding: '12px 16px',
              borderBottom: idx < tickets.length - 1 ? '1px solid #F1F3F6' : undefined,
              alignItems: 'center',
              fontSize: 13,
              color: '#2C3E50',
            }}
          >
            <span
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                paddingRight: 12,
              }}
              title={ticket.title}
            >
              {ticket.title}
            </span>
            <span style={{ color: '#5A6B7F', fontSize: 12 }}>
              {TYPE_LABEL[ticket.type] ?? ticket.type}
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: PRIORITY_COLOR[ticket.priority] ?? '#6B7280',
              }}
            >
              {PRIORITY_LABEL[ticket.priority] ?? ticket.priority}
            </span>
            <span style={{ color: '#5A6B7F', fontSize: 12 }}>
              {STATUS_LABEL[ticket.status] ?? ticket.status}
            </span>
            <span style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setConfirmId(ticket.id)}
                disabled={loading === ticket.id}
                style={{
                  fontSize: 12,
                  padding: '4px 10px',
                  borderRadius: 4,
                  border: '1px solid #FECACA',
                  background: '#FFF5F5',
                  color: '#EF4444',
                  cursor: loading === ticket.id ? 'not-allowed' : 'pointer',
                  opacity: loading === ticket.id ? 0.6 : 1,
                  fontWeight: 500,
                }}
                aria-label={`${ticket.title} 영구 삭제`}
              >
                영구 삭제
              </button>
            </span>
          </div>
        ))}
      </div>

      <ConfirmDialog
        isOpen={confirmId !== null}
        message="이 티켓을 영구 삭제하시겠습니까? 복구할 수 없습니다."
        confirmLabel="영구 삭제"
        confirmVariant="danger"
        onConfirm={() => confirmId !== null && handlePermanentDelete(confirmId)}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  );
}
