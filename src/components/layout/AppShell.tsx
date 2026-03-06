'use client';

import { useState, useCallback, useEffect } from 'react';
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
import { BoardContainer } from '@/components/board/BoardContainer';
import { BoardFilterBar } from '@/components/board/BoardFilterBar';
import { TicketCard } from '@/components/board/TicketCard';
import { useTickets } from '@/hooks/useTickets';
import { useBoardFilter } from '@/hooks/useBoardFilter';
import { findTicket, resolveDropTarget, duplicateTicket } from '@/lib/utils';
import type { TicketWithMeta } from '@/types/index';

export function AppShell() {
  const {
    board,
    filteredBoard,
    isLoading,
    createTicket,
    updateTicket,
    deleteTicket,
    reorder,
  } = useTickets();

  const [currentMemberId, setCurrentMemberId] = useState<number | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/members', { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { members?: Array<{ id: number }> } | null) => {
        if (data?.members?.length) setCurrentMemberId(data.members[0].id);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  const [isCreating, setIsCreating] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketWithMeta | null>(null);
  const [draggingTicket, setDraggingTicket] = useState<TicketWithMeta | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Shared filter logic
  const { displayBoard, filter } = useBoardFilter(filteredBoard, searchQuery);

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
            workspaceName={board.workspaceName}
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

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowX: 'hidden', overflowY: 'auto' }}>
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

      <Footer />
    </div>
  );
}
