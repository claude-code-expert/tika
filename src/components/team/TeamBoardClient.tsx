'use client';

import { useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { BoardContainer } from '@/components/board/BoardContainer';
import { BoardFilterBar } from '@/components/board/BoardFilterBar';
import { TicketCard } from '@/components/board/TicketCard';
import { useTickets } from '@/hooks/useTickets';
import { useBoardFilter } from '@/hooks/useBoardFilter';
import { useResizable } from '@/hooks/useResizable';
import { findTicket, resolveDropTarget, duplicateTicket, truncate } from '@/lib/utils';
import { TICKET_TYPE_META } from '@/lib/constants';
import { PriorityBadge } from '@/components/ui/Chips';
import { LabelBadge } from '@/components/label/LabelBadge';
import type { TicketWithMeta, BoardData } from '@/types/index';

// ─── constants ────────────────────────────────────────────────────────────────
const BACKLOG_MIN = 180;
const BACKLOG_MAX = 380;
const BACKLOG_DEFAULT = 270;

// ─── BacklogItem ──────────────────────────────────────────────────────────────
function BacklogItem({
  ticket,
  onClick,
}: {
  ticket: TicketWithMeta;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: ticket.id,
  });

  const type = TICKET_TYPE_META[ticket.type as keyof typeof TICKET_TYPE_META] ?? TICKET_TYPE_META.TASK;

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: isDragging ? transition : 'background 0.12s',
        opacity: isDragging ? 0.4 : 1,
        padding: '8px 10px',
        borderRadius: 6,
        cursor: 'grab',
        background: '#fff',
        border: ticket.isOverdue ? '1.5px solid #DC2626' : '1px solid #DFE1E6',
        marginBottom: 4,
      }}
      {...attributes}
      {...listeners}
      onClick={() => { if (!isDragging) onClick(); }}
      onKeyDown={(e) => { if (e.key === 'Enter' && !isDragging) onClick(); }}
      role="button"
      tabIndex={0}
      onMouseEnter={(e) => { if (!isDragging) (e.currentTarget as HTMLElement).style.background = '#F8F9FB'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#fff'; }}
      aria-label={`티켓: ${ticket.title}`}
    >
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
            color: '#2C3E50',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            flex: 1,
            minWidth: 0,
          }}
        >
          {truncate(ticket.title, 22)}
        </span>
      </div>
      {/* Labels */}
      {ticket.labels && ticket.labels.length > 0 && (
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginBottom: 4 }}>
          {ticket.labels.slice(0, 3).map((label) => (
            <LabelBadge key={label.id} label={label} size="sm" />
          ))}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <PriorityBadge priority={ticket.priority} size="sm" />
        {ticket.isOverdue && (
          <span style={{ fontSize: 9, fontWeight: 600, color: '#DC2626' }}>마감 초과</span>
        )}
        {ticket.dueDate && !ticket.isOverdue && (
          <span style={{ fontSize: 9, color: '#8993A4' }}>{ticket.dueDate}</span>
        )}

        {/* Assignee avatars */}
        {(() => {
          const assignees = (ticket.assignees && ticket.assignees.length > 0)
            ? ticket.assignees
            : ticket.assignee ? [ticket.assignee] : [];
          if (assignees.length === 0) return null;
          const visible = assignees.slice(0, 3);
          return (
            <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'row-reverse' }}>
              {visible.reverse().map((a) => (
                <div
                  key={a.id}
                  title={a.displayName}
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    fontSize: 9,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    background: a.color,
                    border: '2px solid #fff',
                    marginRight: -5,
                    flexShrink: 0,
                  }}
                >
                  {a.displayName.charAt(0).toUpperCase()}
                </div>
              ))}
            </div>
          );
        })()}
      </div>
    </div>
  );
}

// ─── BacklogPanel ─────────────────────────────────────────────────────────────
function BacklogPanel({
  tickets,
  onTicketClick,
  onAddTicket,
}: {
  tickets: TicketWithMeta[];
  onTicketClick: (ticket: TicketWithMeta) => void;
  onAddTicket: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: 'BACKLOG' });
  const [collapsed, setCollapsed] = useState(false);
  const { width, handleResizeStart, isResizing } = useResizable(BACKLOG_DEFAULT, BACKLOG_MIN, BACKLOG_MAX);

  return (
    <div
      style={{
        position: 'relative',
        flexShrink: 0,
        display: 'flex',
        width: collapsed ? 14 : undefined,
        overflow: 'visible',
      }}
    >
      {/* Collapse/expand toggle */}
      <button
        onClick={() => setCollapsed((p) => !p)}
        style={{
          position: 'absolute',
          top: '50%',
          right: -14,
          transform: 'translateY(-50%)',
          width: 28,
          height: 28,
          borderRadius: '50%',
          border: '1px solid #DFE1E6',
          background: '#fff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#8993A4',
          zIndex: 50,
          boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
          transition: 'background 0.15s',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#E2E5EA'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = '#fff'; }}
        aria-label={collapsed ? '백로그 펼치기' : '백로그 접기'}
        title={collapsed ? '백로그 펼치기' : '백로그 접기'}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Panel body */}
      <div
        style={{
          width: collapsed ? 0 : width,
          minWidth: collapsed ? 0 : BACKLOG_MIN,
          maxWidth: collapsed ? 0 : BACKLOG_MAX,
          transition: 'width 0.2s ease, min-width 0.2s ease',
          background: '#F1F3F6',
          borderRight: collapsed ? 'none' : '1px solid #DFE1E6',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Header */}
        <div
          style={{
            height: 48,
            padding: '0 14px',
            borderBottom: '1px solid #DFE1E6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#5A6B7F',
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
            }}
          >
            Backlog
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: '#8993A4' }}>{tickets.length}건</span>
            <button
              onClick={onAddTicket}
              style={{
                fontSize: 16,
                fontWeight: 500,
                color: '#629584',
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
          </div>
        </div>

        {/* Ticket list */}
        <div
          ref={setNodeRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '8px 8px',
            background: isOver ? 'rgba(98, 149, 132, 0.06)' : undefined,
            transition: 'background 0.15s',
          }}
        >
          {tickets.length === 0 ? (
            <div
              style={{
                padding: '24px 8px',
                textAlign: 'center',
                fontSize: 12,
                color: '#8993A4',
              }}
            >
              <p style={{ marginBottom: 8 }}>백로그가 비어 있습니다</p>
              <button
                onClick={onAddTicket}
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: '#629584',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                새 업무 추가 +
              </button>
            </div>
          ) : (
            <SortableContext
              items={tickets.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              {tickets.map((ticket) => (
                <BacklogItem
                  key={ticket.id}
                  ticket={ticket}
                  onClick={() => onTicketClick(ticket)}
                />
              ))}
            </SortableContext>
          )}
        </div>

        {/* Resize handle */}
        {!collapsed && (
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
              (e.currentTarget as HTMLElement).style.background = '#629584';
              (e.currentTarget as HTMLElement).style.opacity = '0.3';
            }}
            onMouseLeave={(e) => {
              if (!isResizing.current) {
                (e.currentTarget as HTMLElement).style.background = 'transparent';
                (e.currentTarget as HTMLElement).style.opacity = '1';
              }
            }}
            aria-label="백로그 패널 크기 조절"
            role="separator"
          />
        )}
      </div>
    </div>
  );
}

// ─── TeamBoardClient ──────────────────────────────────────────────────────────
interface TeamBoardClientProps {
  initialData: BoardData;
  workspaceId: number;
  currentMemberId: number | null;
}

export function TeamBoardClient({ initialData, currentMemberId }: TeamBoardClientProps) {
  const { board, isLoading, createTicket, updateTicket, deleteTicket, reorder } =
    useTickets(initialData);

  const [isCreating, setIsCreating] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketWithMeta | null>(null);
  const [draggingTicket, setDraggingTicket] = useState<TicketWithMeta | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const handleDuplicate = useCallback(
    (ticket: TicketWithMeta) => duplicateTicket(ticket, createTicket),
    [createTicket],
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      setDraggingTicket(findTicket(board, Number(event.active.id)));
    },
    [board],
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setDraggingTicket(null);
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const target = resolveDropTarget(board, over.id);
      if (!target) return;
      await reorder(Number(active.id), target.status, target.index);
    },
    [board, reorder],
  );

  const { displayBoard, filter } = useBoardFilter(board);

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Backlog panel */}
        <BacklogPanel
          tickets={displayBoard.board.BACKLOG}
          onTicketClick={setSelectedTicket}
          onAddTicket={() => setIsCreating(true)}
        />

        {/* Kanban columns (TODO / IN_PROGRESS / DONE) + Filter bar */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          <BoardFilterBar filter={filter} />
          <BoardContainer
            board={displayBoard}
            isLoading={isLoading}
            createTicket={createTicket}
            updateTicket={updateTicket}
            deleteTicket={deleteTicket}
            onDuplicate={handleDuplicate}
            isCreating={isCreating}
            onCreateClose={() => setIsCreating(false)}
            selectedTicket={selectedTicket}
            onSelectTicket={setSelectedTicket}
            currentMemberId={currentMemberId}
          />
        </div>
      </div>

      <DragOverlay>
        {draggingTicket ? (
          <div className="opacity-90">
            <TicketCard ticket={draggingTicket} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
