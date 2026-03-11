'use client';

import { memo, useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { TicketStatus, TicketWithMeta } from '@/types/index';
import { TicketCard } from './TicketCard';
import { Tooltip } from '@/components/ui/Tooltip';

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
  workspaceName?: string;
}

function ColumnInner({ status, label, tickets, onTicketClick, workspaceName }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const sortableItems = useMemo(() => tickets.map((t) => t.id), [tickets]);

  return (
    <div
      style={{
        flex: 1,
        minWidth: 'var(--column-width)',
        display: 'flex',
        flexDirection: 'column',
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
            fontWeight: 700,
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
        {status === 'IN_PROGRESS' && tickets.length > 3 && (
          <Tooltip
            content={`적정 칸반 티켓수 = 3, 현재 ${tickets.length - 3}건 초과`}
            position="bottom"
          >
            <span
              style={{
                fontSize: 11, fontWeight: 700, color: '#D97706',
                background: '#FEF3C7', borderRadius: 6,
                padding: '2px 7px', display: 'inline-flex', alignItems: 'center', gap: 3,
                cursor: 'default',
              }}
            >
              ⚠ {tickets.length}/3
            </span>
          </Tooltip>
        )}
      </div>

      {/* Drop zone + cards */}
      <div
        ref={setNodeRef}
        className="[&::-webkit-scrollbar]:hidden"
        style={{
          flex: 1,
          padding: 8,
          paddingBottom: 38,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          background: isOver ? 'rgba(98, 149, 132, 0.08)' : 'rgba(0, 0, 0, 0.02)',
          borderRadius: '0 0 var(--radius-column) var(--radius-column)',
          transition: 'background 0.15s',
        }}
      >
        <SortableContext items={sortableItems} strategy={verticalListSortingStrategy}>
          {tickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} onClick={() => onTicketClick(ticket)} workspaceName={workspaceName} />
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

export const Column = memo(ColumnInner);
