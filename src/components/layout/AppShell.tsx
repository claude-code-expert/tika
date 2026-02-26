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
import type { TicketWithMeta, TicketStatus, BoardData, TicketPriority } from '@/types/index';

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

  // Get current member ID from session (for comment ownership)
  const [currentMemberId, setCurrentMemberId] = useState<number | null>(null);
  useEffect(() => {
    fetch('/api/members')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { members?: Array<{ id: number }> } | null) => {
        if (data?.members?.length) setCurrentMemberId(data.members[0].id);
      })
      .catch(() => {});
  }, []);

  const [isCreating, setIsCreating] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketWithMeta | null>(null);
  const [draggingTicket, setDraggingTicket] = useState<TicketWithMeta | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [activePriorities, setActivePriorities] = useState<TicketPriority[]>([]);
  const [dueDateFrom, setDueDateFrom] = useState('');
  const [dueDateTo, setDueDateTo] = useState('');

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

    // Priority filter
    if (activePriorities.length > 0) {
      const pf = (t: TicketWithMeta) => activePriorities.includes(t.priority);
      base = {
        ...base,
        board: {
          BACKLOG: base.board.BACKLOG.filter(pf),
          TODO: base.board.TODO.filter(pf),
          IN_PROGRESS: base.board.IN_PROGRESS.filter(pf),
          DONE: base.board.DONE.filter(pf),
        },
      };
    }

    // Date range filter
    if (dueDateFrom || dueDateTo) {
      const rf = (t: TicketWithMeta) => {
        if (!t.dueDate) return false;
        if (dueDateFrom && t.dueDate < dueDateFrom) return false;
        if (dueDateTo && t.dueDate > dueDateTo) return false;
        return true;
      };
      base = {
        ...base,
        board: {
          BACKLOG: base.board.BACKLOG.filter(rf),
          TODO: base.board.TODO.filter(rf),
          IN_PROGRESS: base.board.IN_PROGRESS.filter(rf),
          DONE: base.board.DONE.filter(rf),
        },
      };
    }

    const total = Object.values(base.board).reduce((s, arr) => s + arr.length, 0);
    return { ...base, total };
  }, [filteredBoard, activeFilter, searchQuery, activePriorities, dueDateFrom, dueDateTo]);

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
        onToggleSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
      />

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <Sidebar
            backlogTickets={displayBoard.board.BACKLOG}
            isLoading={isLoading}
            onTicketClick={(ticket) => {
              setSelectedTicket(ticket);
              setIsMobileSidebarOpen(false);
            }}
            onAddTicket={() => {
              setIsCreating(true);
              setIsMobileSidebarOpen(false);
            }}
            isMobileOpen={isMobileSidebarOpen}
            onMobileClose={() => setIsMobileSidebarOpen(false)}
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

              {/* Advanced filter toggle */}
              <button
                className="chip"
                data-active={showAdvancedFilter ? 'true' : undefined}
                onClick={() => setShowAdvancedFilter((p) => !p)}
                title="고급 필터"
              >
                ⚙ 필터
                {(activePriorities.length > 0 || dueDateFrom || dueDateTo) && (
                  <span className="chip-count" style={{ background: 'var(--color-accent)', color: '#fff' }}>
                    {activePriorities.length + (dueDateFrom || dueDateTo ? 1 : 0)}
                  </span>
                )}
              </button>

              {/* Clear all filters shortcut */}
              {(activeFilter !== 'all' || activeLabels.length > 0 || activePriorities.length > 0 || dueDateFrom || dueDateTo || searchQuery) && (
                <button
                  className="chip"
                  onClick={() => {
                    setActiveFilter('all');
                    clearLabels();
                    setActivePriorities([]);
                    setDueDateFrom('');
                    setDueDateTo('');
                    setShowAdvancedFilter(false);
                  }}
                  style={{ color: '#EF4444', borderColor: '#FCA5A5' }}
                >
                  ✕ 초기화
                </button>
              )}
            </div>

            {/* Advanced filter panel */}
            {showAdvancedFilter && (
              <div
                style={{
                  padding: '10px 16px',
                  background: 'var(--color-sidebar-bg)',
                  borderBottom: '1px solid var(--color-border)',
                  display: 'flex',
                  gap: 20,
                  alignItems: 'flex-end',
                  flexWrap: 'wrap',
                  flexShrink: 0,
                }}
              >
                {/* Priority filter */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 6 }}>
                    우선순위
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as TicketPriority[]).map((p) => {
                      const isActive = activePriorities.includes(p);
                      const colors: Record<TicketPriority, { bg: string; color: string }> = {
                        LOW: { bg: '#F3F4F6', color: '#6B7280' },
                        MEDIUM: { bg: '#FEF9C3', color: '#A16207' },
                        HIGH: { bg: '#FFEDD5', color: '#C2410C' },
                        CRITICAL: { bg: '#FEE2E2', color: '#DC2626' },
                      };
                      const { bg, color } = colors[p];
                      return (
                        <button
                          key={p}
                          onClick={() =>
                            setActivePriorities((prev) =>
                              isActive ? prev.filter((x) => x !== p) : [...prev, p],
                            )
                          }
                          style={{
                            padding: '3px 10px',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 600,
                            background: isActive ? color : bg,
                            color: isActive ? '#fff' : color,
                            border: `1px solid ${isActive ? color : 'transparent'}`,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            transition: 'all 0.15s',
                          }}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Date range filter */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 6 }}>
                    마감일 범위
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input
                      type="date"
                      value={dueDateFrom}
                      onChange={(e) => setDueDateFrom(e.target.value)}
                      style={{
                        padding: '4px 8px',
                        border: '1px solid var(--color-border)',
                        borderRadius: 6,
                        fontSize: 12,
                        fontFamily: 'inherit',
                        background: '#fff',
                        color: 'var(--color-text-primary)',
                        outline: 'none',
                      }}
                      aria-label="마감일 시작"
                    />
                    <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>~</span>
                    <input
                      type="date"
                      value={dueDateTo}
                      onChange={(e) => setDueDateTo(e.target.value)}
                      style={{
                        padding: '4px 8px',
                        border: '1px solid var(--color-border)',
                        borderRadius: 6,
                        fontSize: 12,
                        fontFamily: 'inherit',
                        background: '#fff',
                        color: 'var(--color-text-primary)',
                        outline: 'none',
                      }}
                      aria-label="마감일 종료"
                    />
                    {(dueDateFrom || dueDateTo) && (
                      <button
                        onClick={() => { setDueDateFrom(''); setDueDateTo(''); }}
                        style={{
                          fontSize: 11, color: 'var(--color-text-muted)', background: 'none',
                          border: 'none', cursor: 'pointer', padding: '2px 4px',
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

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
