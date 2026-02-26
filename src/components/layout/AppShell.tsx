'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { FilterBar } from '@/components/ui/FilterBar';
import { BoardContainer } from '@/components/board/BoardContainer';
import { TicketCard } from '@/components/board/TicketCard';
import { useTickets } from '@/hooks/useTickets';
import { useLabels } from '@/hooks/useLabels';
import type { TicketWithMeta, TicketStatus, BoardData } from '@/types/index';

type ActiveFilter = 'all' | 'this_week' | 'overdue';

function findTicket(board: BoardData, id: number): TicketWithMeta | null {
  for (const tickets of Object.values(board.board)) {
    const found = tickets.find((t) => t.id === id);
    if (found) return found;
  }
  return null;
}

function resolveDropTarget(
  board: BoardData,
  overId: string | number,
): { status: TicketStatus; index: number } | null {
  const statuses = Object.keys(board.board) as TicketStatus[];
  if (statuses.includes(overId as TicketStatus)) {
    return { status: overId as TicketStatus, index: board.board[overId as TicketStatus].length };
  }
  for (const status of statuses) {
    const idx = board.board[status].findIndex((t) => t.id === Number(overId));
    if (idx !== -1) return { status, index: idx };
  }
  return null;
}

export function AppShell() {
  const {
    board,
    filteredBoard,
    isLoading,
    createTicket,
    updateTicket,
    deleteTicket,
    reorder,
    activeLabels,
    toggleLabel,
    clearLabels,
  } = useTickets();
  const { labels, fetchLabels } = useLabels();

  const [isCreating, setIsCreating] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketWithMeta | null>(null);
  const [draggingTicket, setDraggingTicket] = useState<TicketWithMeta | null>(null);
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchLabels();
  }, [fetchLabels]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  // Merge label filter + search + date filter into displayBoard
  const displayBoard = useMemo((): BoardData => {
    let base = filteredBoard;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const sf = (t: TicketWithMeta) =>
        t.title.toLowerCase().includes(q) || (t.description?.toLowerCase().includes(q) ?? false);
      base = {
        ...base,
        board: {
          BACKLOG: base.board.BACKLOG.filter(sf),
          TODO: base.board.TODO.filter(sf),
          IN_PROGRESS: base.board.IN_PROGRESS.filter(sf),
          DONE: base.board.DONE.filter(sf),
        },
      };
    }

    if (activeFilter !== 'all') {
      const now = new Date();
      const df =
        activeFilter === 'this_week'
          ? (t: TicketWithMeta) => {
              if (!t.dueDate) return false;
              const due = new Date(t.dueDate);
              const weekEnd = new Date(now);
              weekEnd.setDate(now.getDate() + (6 - now.getDay()));
              return due >= now && due <= weekEnd;
            }
          : (t: TicketWithMeta) => t.isOverdue;
      base = {
        ...base,
        board: {
          BACKLOG: base.board.BACKLOG.filter(df),
          TODO: base.board.TODO.filter(df),
          IN_PROGRESS: base.board.IN_PROGRESS.filter(df),
          DONE: base.board.DONE.filter(df),
        },
      };
    }

    const total = Object.values(base.board).reduce((s, arr) => s + arr.length, 0);
    return { ...base, total };
  }, [filteredBoard, activeFilter, searchQuery]);

  const thisWeekCount = useMemo(() => {
    const now = new Date();
    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() + (6 - now.getDay()));
    return Object.values(board.board)
      .flat()
      .filter((t) => {
        if (!t.dueDate) return false;
        const due = new Date(t.dueDate);
        return due >= now && due <= weekEnd;
      }).length;
  }, [board]);

  const overdueCount = useMemo(
    () => Object.values(board.board).flat().filter((t) => t.isOverdue).length,
    [board],
  );

  const handleDuplicate = useCallback(
    async (ticket: TicketWithMeta) => {
      const created = (await createTicket({
        title: `${ticket.title} (복사)`,
        type: ticket.type,
        priority: ticket.priority,
        dueDate: ticket.dueDate ?? undefined,
        labelIds: ticket.labels.map((l) => l.id),
        issueId: ticket.issueId ?? undefined,
        assigneeId: ticket.assigneeId ?? undefined,
      })) as { id: number } | undefined;

      if (created?.id && ticket.checklistItems.length > 0) {
        for (const item of ticket.checklistItems) {
          await fetch(`/api/tickets/${created.id}/checklist`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: item.text }),
          }).catch(() => {});
        }
      }
    },
    [createTicket],
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const ticket = findTicket(board, Number(event.active.id));
      setDraggingTicket(ticket);
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

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
        background: 'var(--color-app-bg)',
      }}
    >
      <Header
        onNewTask={() => setIsCreating(true)}
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
      />

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <Sidebar
            backlogTickets={displayBoard.board.BACKLOG}
            isLoading={isLoading}
            onTicketClick={setSelectedTicket}
            onAddTicket={() => setIsCreating(true)}
          />

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Filter bar */}
            <div className="filter-bar">
              <button
                className="chip"
                data-active={activeFilter === 'all' ? 'true' : undefined}
                onClick={() => setActiveFilter('all')}
              >
                전체
                <span className="chip-count">{board.total}</span>
              </button>
              <button
                className="chip"
                data-active={activeFilter === 'this_week' ? 'true' : undefined}
                onClick={() => setActiveFilter('this_week')}
              >
                이번 주 업무
                <span className="chip-count">{thisWeekCount}</span>
              </button>
              <button
                className="chip"
                data-active={activeFilter === 'overdue' ? 'true' : undefined}
                onClick={() => setActiveFilter('overdue')}
              >
                일정 초과
                <span className="chip-count">{overdueCount}</span>
              </button>
              <FilterBar
                labels={labels}
                activeLabels={activeLabels}
                onLabelToggle={toggleLabel}
                onClearLabels={clearLabels}
              />
            </div>

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
            />
          </div>
        </div>

        {/* Drag overlay */}
        <DragOverlay>
          {draggingTicket ? (
            <div className="rotate-2 opacity-90">
              <TicketCard ticket={draggingTicket} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <Footer />
    </div>
  );
}
