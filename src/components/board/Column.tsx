'use client';

import { memo, useMemo, Fragment } from 'react';
import { useDroppable, useDndContext } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { TicketStatus, TicketWithMeta } from '@/types/index';
import { TicketCard } from './TicketCard';
import { Tooltip } from '@/components/ui/Tooltip';

const COLUMN_HEADER_BG: Partial<Record<TicketStatus, string>> = {
  TODO: 'var(--color-col-todo)',
  IN_PROGRESS: 'var(--color-col-in-progress)',
  DONE: 'var(--color-col-done)',
};

const COLUMN_CARD_BG: Record<TicketStatus, string> = {
  BACKLOG:     'var(--color-card-bg-backlog)',
  TODO:        'var(--color-card-bg-todo)',
  IN_PROGRESS: 'var(--color-card-bg-in-progress)',
  DONE:        'var(--color-card-bg-done)',
};

interface ColumnProps {
  status: TicketStatus;
  label: string;
  tickets: TicketWithMeta[];
  onTicketClick: (ticket: TicketWithMeta) => void;
  workspaceName?: string;
  currentMemberId?: number | null;
}

function ColumnInner({ status, label, tickets, onTicketClick, workspaceName, currentMemberId }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const { active, over } = useDndContext();
  const sortableItems = useMemo(() => tickets.map((t) => t.id), [tickets]);

  // Determine where to show the drop indicator line
  const dropIndicatorIdx = useMemo(() => {
    if (!active || !over || active.id === over.id) return -1;
    const overIdx = tickets.findIndex((t) => t.id === Number(over.id));
    if (overIdx !== -1) return overIdx;
    // Hovering on column itself (empty area) → show at end
    if (over.id === status && isOver) return tickets.length;
    return -1;
  }, [active, over, tickets, status, isOver]);

  // WIP limit: count only my tickets in IN_PROGRESS
  const myWipCount = useMemo(() => {
    if (status !== 'IN_PROGRESS' || !currentMemberId) return 0;
    return tickets.filter((t) =>
      t.assignees?.some((a) => a.id === currentMemberId) ||
      t.assignee?.id === currentMemberId,
    ).length;
  }, [status, currentMemberId, tickets]);

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <h3
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 14,
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              margin: 0,
            }}
          >
            {label}
          </h3>
          {status === 'IN_PROGRESS' && myWipCount > 3 && (
            <Tooltip
              content={`내 진행 중 업무 적정 수 = 3, 현재 ${myWipCount - 3}건 초과`}
              position="bottom"
            >
              <span
                title="WIP 한도 초과: 내 진행 중 업무가 3개를 초과했습니다"
                style={{
                  fontSize: 11, fontWeight: 700, color: '#D97706',
                  background: '#FEF3C7', borderRadius: 6,
                  padding: '2px 7px', display: 'inline-flex', alignItems: 'center', gap: 3,
                  cursor: 'default',
                }}
              >
                ⚠ {myWipCount}/3
              </span>
            </Tooltip>
          )}
        </div>
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
        aria-label={`${label} 칼럼 드롭 영역`}
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
          {tickets.map((ticket, idx) => (
            <Fragment key={ticket.id}>
              {idx === dropIndicatorIdx && Number(active?.id) !== ticket.id && (
                <div style={{
                  height: 3,
                  background: 'var(--color-accent, #629584)',
                  borderRadius: 2,
                  transition: 'opacity 0.15s',
                }} />
              )}
              <TicketCard ticket={ticket} onClick={() => onTicketClick(ticket)} workspaceName={workspaceName} cardBg={COLUMN_CARD_BG[status]} />
            </Fragment>
          ))}
          {dropIndicatorIdx === tickets.length && (
            <div style={{
              height: 3,
              background: 'var(--color-accent, #629584)',
              borderRadius: 2,
              transition: 'opacity 0.15s',
            }} />
          )}
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
