'use client';

import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import type { TicketWithMeta } from '@/types/index';
import { TicketCard } from '@/components/board/TicketCard';

interface SidebarProps {
  backlogTickets: TicketWithMeta[];
  totalCount: number;
  isLoading: boolean;
  onTicketClick?: (ticket: TicketWithMeta) => void;
  onAddTicket?: () => void;
}

export function Sidebar({
  backlogTickets,
  totalCount,
  isLoading,
  onTicketClick,
  onAddTicket,
}: SidebarProps) {
  const { setNodeRef, isOver } = useDroppable({ id: 'BACKLOG' });

  return (
    <aside
      style={{
        width: 'var(--sidebar-width)',
        minWidth: 0,
        background: 'var(--color-sidebar-bg)',
        borderRight: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      {/* Workspace header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '12px 16px',
          borderBottom: '1px solid var(--color-border)',
          minHeight: 52,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 'var(--radius-button)',
            background: 'var(--color-accent)',
            color: '#fff',
            fontSize: 12,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          T
        </div>
        <div style={{ overflow: 'hidden' }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: 'var(--color-text-primary)',
              whiteSpace: 'nowrap',
            }}
          >
            내 워크스페이스
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>개인</div>
        </div>
      </div>

      {/* Navigation */}
      <nav
        style={{ padding: '8px 0', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--color-accent)',
            background: 'var(--color-accent-light)',
            cursor: 'pointer',
          }}
        >
          <svg
            width={14}
            height={14}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width={7} height={7} x={3} y={3} rx={1} />
            <rect width={7} height={7} x={14} y={3} rx={1} />
            <rect width={7} height={7} x={14} y={14} rx={1} />
            <rect width={7} height={7} x={3} y={14} rx={1} />
          </svg>
          칸반 보드
          <span
            style={{
              marginLeft: 'auto',
              fontSize: 11,
              background: 'var(--color-accent)',
              color: '#fff',
              padding: '2px 8px',
              borderRadius: 10,
              minWidth: 24,
              textAlign: 'center',
            }}
          >
            {totalCount}
          </span>
        </div>
      </nav>

      {/* Backlog list */}
      <div
        ref={setNodeRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          background: isOver ? 'rgba(98, 149, 132, 0.06)' : undefined,
          transition: 'background 0.15s',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 8px 4px',
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
            백로그
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
              {backlogTickets.length}건
            </span>
            {onAddTicket && (
              <button
                onClick={onAddTicket}
                style={{
                  fontSize: 16,
                  fontWeight: 500,
                  color: 'var(--color-accent)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  lineHeight: 1,
                }}
                aria-label="새 업무 추가"
              >
                +
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div
            style={{
              padding: '24px 8px',
              textAlign: 'center',
              fontSize: 12,
              color: 'var(--color-text-muted)',
            }}
          >
            로딩 중...
          </div>
        ) : backlogTickets.length === 0 ? (
          <div
            style={{
              padding: '24px 8px',
              textAlign: 'center',
              fontSize: 12,
              color: 'var(--color-text-muted)',
            }}
          >
            <p style={{ marginBottom: 8 }}>할 일을 추가해보세요</p>
            {onAddTicket && (
              <button
                onClick={onAddTicket}
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: 'var(--color-accent)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                새 업무 추가 +
              </button>
            )}
          </div>
        ) : (
          <SortableContext
            items={backlogTickets.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            {backlogTickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                onClick={() => onTicketClick?.(ticket)}
              />
            ))}
          </SortableContext>
        )}
      </div>
    </aside>
  );
}
