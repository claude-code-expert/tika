'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { TicketStatus, TicketWithMeta } from '@/types/index';
import { TicketCard } from './TicketCard';

const COLUMN_HEADER_BG: Partial<Record<TicketStatus, string>> = {
  TODO: 'var(--color-col-todo)',
  IN_PROGRESS: 'var(--color-col-in-progress)',
  DONE: 'var(--color-col-done)',
};

interface ColumnProps {
  status: TicketStatus;
  label: string;
  tickets: TicketWithMeta[];
  onTicketClick: (ticket: TicketWithMeta) => void;
}

export function Column({ status, label, tickets, onTicketClick }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      style={{
        minWidth: 'var(--column-width)',
        width: 'var(--column-width)',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '100%',
        flexShrink: 0,
        background: 'var(--color-col-bg)',
        borderRadius: 'var(--radius-column)',
      }}
    >
      {/* Column header */}
      <div
        style={{
          padding: '12px 16px',
          borderRadius: 'var(--radius-column) var(--radius-column) 0 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: 44,
          background: COLUMN_HEADER_BG[status] ?? 'var(--color-col-backlog)',
        }}
      >
        <span
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--color-text-primary)',
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            padding: '2px 8px',
            borderRadius: 10,
            background: 'rgba(0,0,0,0.08)',
            color: 'var(--color-text-secondary)',
          }}
        >
          {tickets.length}
        </span>
      </div>

      {/* Drop zone + cards */}
      <div
        ref={setNodeRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          minHeight: 100,
          background: isOver ? 'rgba(98, 149, 132, 0.08)' : 'rgba(0, 0, 0, 0.02)',
          borderRadius: '0 0 var(--radius-column) var(--radius-column)',
          transition: 'background 0.15s',
        }}
      >
        <SortableContext items={tickets.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} onClick={() => onTicketClick(ticket)} />
          ))}
        </SortableContext>

        {/* Empty state */}
        {tickets.length === 0 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '32px 12px',
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>비어있음</p>
          </div>
        )}
      </div>
    </div>
  );
}
