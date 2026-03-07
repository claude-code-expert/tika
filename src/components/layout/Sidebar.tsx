'use client';

import { useState, useEffect } from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import type { TicketWithMeta } from '@/types/index';
import { ChevronRight, ChevronLeft, X } from 'lucide-react';
import { useResizable } from '@/hooks/useResizable';
import { truncate } from '@/lib/utils';
import { TICKET_TYPE_META } from '@/lib/constants';
import { PriorityBadge } from '@/components/ui/Chips';
import { LabelBadge } from '@/components/label/LabelBadge';
import { Toast } from '@/components/ui/Toast';

const SIDEBAR_MIN = 200;
const SIDEBAR_MAX = 400;
const SIDEBAR_DEFAULT = 260;

function formatDeadline(dueDate: string | null, isOverdue: boolean): string | null {
  if (!dueDate) return null;
  if (isOverdue) return '마감 초과';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return '오늘까지';
  if (diffDays === 1) return '내일까지';
  if (diffDays <= 7) return `${diffDays}일 남음`;
  return dueDate;
}


function SidebarTask({ ticket, onClick }: { ticket: TicketWithMeta; onClick?: () => void; workspaceName?: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: ticket.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const type = TICKET_TYPE_META[ticket.type as keyof typeof TICKET_TYPE_META] ?? TICKET_TYPE_META.TASK;
  const deadline = formatDeadline(ticket.plannedEndDate, ticket.isOverdue);

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        padding: '8px 10px',
        borderRadius: 6,
        cursor: 'pointer',
        background: 'var(--color-card-bg)',
        border: ticket.isOverdue ? '1.5px solid #DC2626' : '1px solid var(--color-border)',
        transition: isDragging ? undefined : 'background 0.12s',
      }}
      {...attributes}
      {...listeners}
      onClick={() => {
        if (!isDragging) onClick?.();
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !isDragging) onClick?.();
      }}
      onMouseEnter={(e) => {
        if (!isDragging) {
          (e.currentTarget as HTMLElement).style.background = 'var(--color-sidebar-hover)';
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = 'var(--color-card-bg)';
      }}
      aria-label={`티켓: ${ticket.title}`}
    >
      {/* Row 1: Type badge + Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 16,
            height: 16,
            borderRadius: 3,
            fontSize: 9,
            fontWeight: 700,
            color: '#fff',
            background: type.bg,
            flexShrink: 0,
          }}
        >
          {type.abbr}
        </span>
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            flex: 1,
            minWidth: 0,
          }}
        >
          {truncate(ticket.title, 20)}
        </span>
      </div>
      {/* Row 2: Priority (left) | Labels (center) | Deadline (right) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        {/* Left: Priority */}
        <PriorityBadge priority={ticket.priority} size="sm" />
        {/* Center: Labels */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 3,
            minWidth: 0,
            overflow: 'hidden',
          }}
        >
          {ticket.labels.map((label) => (
            <LabelBadge key={label.id} label={label} size="sm" />
          ))}
        </div>
        {/* Right: Deadline */}
        {deadline && (
          <span
            style={{
              fontSize: 10,
              color: ticket.isOverdue ? '#DC2626' : 'var(--color-text-muted)',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {deadline}
          </span>
        )}
      </div>
    </div>
  );
}

interface SidebarProps {
  backlogTickets: TicketWithMeta[];
  isLoading: boolean;
  workspaceName?: string;
  onTicketClick?: (ticket: TicketWithMeta) => void;
  onAddTicket?: () => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({
  backlogTickets,
  isLoading,
  workspaceName,
  onTicketClick,
  onAddTicket,
  isMobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  const { setNodeRef, isOver } = useDroppable({ id: 'BACKLOG' });
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { width, handleResizeStart, isResizing } = useResizable(SIDEBAR_DEFAULT, SIDEBAR_MIN, SIDEBAR_MAX);
  const [toast, setToast] = useState(false);

  const showToast = () => {
    setToast(true);
    setTimeout(() => setToast(false), 2000);
  };

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return (
    <>
      {/* Mobile backdrop */}
      {isMobile && isMobileOpen && (
        <div
          onClick={onMobileClose}
          aria-hidden="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 199,
          }}
        />
      )}

    <div
      style={{
        position: 'relative',
        flexShrink: 0,
        display: 'flex',
        // On mobile, take no flex space — aside is rendered as fixed overlay
        ...(isMobile
          ? { width: 0, overflow: 'visible', minWidth: 0 }
          : { width: collapsed ? 14 : undefined, overflow: 'visible' }),
      }}
    >
      {/* Floating toggle button — desktop only */}
      {!isMobile && (
        <button
          onClick={() => setCollapsed((prev) => !prev)}
          style={{
            position: 'absolute',
            top: '50%',
            right: -14,
            transform: 'translateY(-50%)',
            width: 28,
            height: 28,
            borderRadius: '50%',
            border: '1px solid var(--color-border)',
            background: 'var(--color-card-bg)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            color: 'var(--color-text-muted)',
            zIndex: 50,
            boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'var(--color-sidebar-hover)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'var(--color-card-bg)';
          }}
          aria-label={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
          title={collapsed ? '사이드바 펼치기' : '사이드바 접기'}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      )}

      <aside
        style={{
          // Mobile: fixed overlay drawer
          ...(isMobile
            ? {
                position: 'fixed',
                top: 0,
                left: 0,
                height: '100vh',
                width: SIDEBAR_DEFAULT,
                minWidth: SIDEBAR_DEFAULT,
                maxWidth: SIDEBAR_DEFAULT,
                zIndex: 200,
                transform: isMobileOpen ? 'translateX(0)' : 'translateX(-100%)',
                transition: 'transform 0.25s ease',
                boxShadow: isMobileOpen ? '4px 0 20px rgba(0,0,0,0.2)' : 'none',
              }
            : {
                // Desktop: inline sidebar
                position: 'relative',
                width: collapsed ? 0 : width,
                minWidth: collapsed ? 0 : SIDEBAR_MIN,
                maxWidth: collapsed ? 0 : SIDEBAR_MAX,
                transition: 'width 0.2s ease, min-width 0.2s ease',
              }),
          background: 'var(--color-sidebar-bg)',
          borderRight: !isMobile && collapsed ? 'none' : '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
      {/* Workspace header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: 'var(--radius-button)',
              background: 'var(--color-accent)',
              color: '#fff',
              fontSize: 11,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            T
          </div>
          <span
            style={{
              flex: 1,
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            내 워크스페이스
          </span>
          {/* Mobile close button */}
          {isMobile ? (
            <button
              onClick={onMobileClose}
              aria-label="사이드바 닫기"
              style={{
                width: 44,
                height: 44,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-text-muted)',
                flexShrink: 0,
              }}
            >
              <X size={18} />
            </button>
          ) : (
            <button
              onClick={showToast}
              aria-label="설정"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                flexShrink: 0,
              }}
            >
              <svg
                width={15}
                height={15}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <rect width={18} height={18} x={3} y={3} rx={2} />
                <path d="M12 8v8" />
                <path d="m8 12 4 4 4-4" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Backlog list */}
      <div
        ref={setNodeRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
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
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
            }}
          >
            내 업무
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
              <SidebarTask
                key={ticket.id}
                ticket={ticket}
                onClick={() => onTicketClick?.(ticket)}
                workspaceName={workspaceName}
              />
            ))}
          </SortableContext>
        )}
      </div>

      {/* Resize handle — desktop only */}
      {!isMobile && !collapsed && (
        <div
          onMouseDown={handleResizeStart}
          style={{
            position: 'absolute',
            top: 0,
            right: -3,
            width: 6,
            height: '100%',
            cursor: 'col-resize',
            zIndex: 10,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'var(--color-accent)';
            (e.currentTarget as HTMLElement).style.opacity = '0.3';
          }}
          onMouseLeave={(e) => {
            if (!isResizing.current) {
              (e.currentTarget as HTMLElement).style.background = 'transparent';
              (e.currentTarget as HTMLElement).style.opacity = '1';
            }
          }}
          aria-label="사이드바 크기 조절"
          role="separator"
        />
      )}
      </aside>
    </div>

    {toast && <Toast message="준비중입니다" />}
    </>
  );
}
