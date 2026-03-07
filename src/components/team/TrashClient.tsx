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

const PAGE_SIZE = 10;

export function TrashClient({ initialTickets }: TrashClientProps) {
  const [tickets, setTickets] = useState<TicketWithMeta[]>(initialTickets);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [loading, setLoading] = useState<number | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const visibleTickets = tickets.slice(0, visibleCount);
  const hasMore = visibleCount < tickets.length;
  const allSelected = visibleTickets.length > 0 && visibleTickets.every((t) => selected.has(t.id));

  function toggleAll() {
    if (allSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        visibleTickets.forEach((t) => next.delete(t.id));
        return next;
      });
    } else {
      setSelected((prev) => new Set([...prev, ...visibleTickets.map((t) => t.id)]));
    }
  }

  function toggleOne(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleRestore(id: number) {
    setLoading(id);
    try {
      const res = await fetch(`/api/tickets/trash/${id}`, { method: 'PATCH' });
      if (res.ok) {
        setTickets((prev) => prev.filter((t) => t.id !== id));
        setSelected((prev) => { const next = new Set(prev); next.delete(id); return next; });
      }
    } finally {
      setLoading(null);
    }
  }

  async function handlePermanentDelete(id: number) {
    setLoading(id);
    try {
      const res = await fetch(`/api/tickets/trash/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setTickets((prev) => prev.filter((t) => t.id !== id));
        setSelected((prev) => { const next = new Set(prev); next.delete(id); return next; });
      }
    } finally {
      setLoading(null);
      setConfirmId(null);
    }
  }

  async function handleBulkDelete() {
    setBulkLoading(true);
    try {
      const ids = Array.from(selected);
      const res = await fetch('/api/tickets/trash', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      if (res.ok) {
        setTickets((prev) => prev.filter((t) => !selected.has(t.id)));
        setSelected(new Set());
      }
    } finally {
      setBulkLoading(false);
      setConfirmBulk(false);
    }
  }

  if (tickets.length === 0) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
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
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
      <div style={{ maxWidth: 900 }}>
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <p style={{ fontSize: 13, color: '#8993A4', margin: 0 }}>
          삭제된 티켓 {tickets.length}개 — 영구 삭제하면 복구할 수 없습니다.
        </p>
        {selected.size > 0 && (
          <button
            onClick={() => setConfirmBulk(true)}
            disabled={bulkLoading}
            style={{ fontSize: 12, padding: '6px 14px', borderRadius: 6, border: '1px solid #FECACA', background: '#FFF5F5', color: '#EF4444', cursor: 'pointer', fontWeight: 600 }}
          >
            선택 {selected.size}건 영구 삭제
          </button>
        )}
      </div>

      <div style={{ border: '1px solid #DFE1E6', borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
        {/* Header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '36px 1fr 80px 80px 90px 160px',
            padding: '10px 16px',
            background: '#F8F9FB',
            borderBottom: '1px solid #DFE1E6',
            fontSize: 11,
            fontWeight: 600,
            color: '#8993A4',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            alignItems: 'center',
          }}
        >
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
            style={{ cursor: 'pointer', width: 14, height: 14 }}
            aria-label="전체 선택"
          />
          <span>제목</span>
          <span>유형</span>
          <span>우선순위</span>
          <span>상태</span>
          <span />
        </div>

        {visibleTickets.map((ticket, idx) => (
          <div
            key={ticket.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '36px 1fr 80px 80px 90px 160px',
              padding: '12px 16px',
              borderBottom: idx < visibleTickets.length - 1 ? '1px solid #F1F3F6' : undefined,
              alignItems: 'center',
              fontSize: 13,
              color: '#2C3E50',
              background: selected.has(ticket.id) ? '#F8F9FB' : undefined,
            }}
          >
            <input
              type="checkbox"
              checked={selected.has(ticket.id)}
              onChange={() => toggleOne(ticket.id)}
              style={{ cursor: 'pointer', width: 14, height: 14 }}
              aria-label={`${ticket.title} 선택`}
            />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 12 }} title={ticket.title}>
              {ticket.title}
            </span>
            <span style={{ color: '#5A6B7F', fontSize: 12 }}>{TYPE_LABEL[ticket.type] ?? ticket.type}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: PRIORITY_COLOR[ticket.priority] ?? '#6B7280' }}>
              {PRIORITY_LABEL[ticket.priority] ?? ticket.priority}
            </span>
            <span style={{ color: '#5A6B7F', fontSize: 12 }}>{STATUS_LABEL[ticket.status] ?? ticket.status}</span>
            <span style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
              <button
                onClick={() => handleRestore(ticket.id)}
                disabled={loading === ticket.id}
                style={{ fontSize: 12, padding: '4px 10px', borderRadius: 4, border: '1px solid #D1FAE5', background: '#F0FDF4', color: '#16A34A', cursor: loading === ticket.id ? 'not-allowed' : 'pointer', opacity: loading === ticket.id ? 0.6 : 1, fontWeight: 500 }}
                aria-label={`${ticket.title} 복구`}
              >
                복구
              </button>
              <button
                onClick={() => setConfirmId(ticket.id)}
                disabled={loading === ticket.id}
                style={{ fontSize: 12, padding: '4px 10px', borderRadius: 4, border: '1px solid #FECACA', background: '#FFF5F5', color: '#EF4444', cursor: loading === ticket.id ? 'not-allowed' : 'pointer', opacity: loading === ticket.id ? 0.6 : 1, fontWeight: 500 }}
                aria-label={`${ticket.title} 영구 삭제`}
              >
                영구 삭제
              </button>
            </span>
          </div>
        ))}
      </div>

      {hasMore && (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            style={{ fontSize: 13, padding: '8px 24px', borderRadius: 6, border: '1px solid #DFE1E6', background: '#fff', color: '#5A6B7F', cursor: 'pointer', fontWeight: 500 }}
          >
            더 보기 ({tickets.length - visibleCount}개 남음)
          </button>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmId !== null}
        message="이 티켓을 영구 삭제하시겠습니까? 복구할 수 없습니다."
        confirmLabel="영구 삭제"
        confirmVariant="danger"
        onConfirm={() => confirmId !== null && handlePermanentDelete(confirmId)}
        onCancel={() => setConfirmId(null)}
      />
      <ConfirmDialog
        isOpen={confirmBulk}
        message={`선택한 ${selected.size}개 티켓을 영구 삭제하시겠습니까? 복구할 수 없습니다.`}
        confirmLabel="영구 삭제"
        confirmVariant="danger"
        onConfirm={handleBulkDelete}
        onCancel={() => setConfirmBulk(false)}
      />
      </div>
    </div>
  );
}
