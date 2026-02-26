'use client';

import { useState, useCallback } from 'react';
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
import { TicketCard } from '@/components/board/TicketCard';
import { useTickets } from '@/hooks/useTickets';
import type { TicketWithMeta, TicketStatus, BoardData } from '@/types/index';

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
  const { board, isLoading, createTicket, updateTicket, deleteTicket, reorder } = useTickets();
  const [isCreating, setIsCreating] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketWithMeta | null>(null);
  const [draggingTicket, setDraggingTicket] = useState<TicketWithMeta | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
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
      <Header onNewTask={() => setIsCreating(true)} />

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <Sidebar
            backlogTickets={board.board.BACKLOG}
            isLoading={isLoading}
            onTicketClick={setSelectedTicket}
            onAddTicket={() => setIsCreating(true)}
          />

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Filter bar */}
            <div className="filter-bar">
              <button className="chip" data-active="true">
                전체
                <span className="chip-count">{board.total}</span>
              </button>
              <button className="chip">
                이번 주 업무
                <span className="chip-count">
                  {Object.values(board.board).flat().filter((t) => {
                    if (!t.dueDate) return false;
                    const due = new Date(t.dueDate);
                    const now = new Date();
                    const weekEnd = new Date(now);
                    weekEnd.setDate(now.getDate() + (6 - now.getDay()));
                    return due >= now && due <= weekEnd;
                  }).length}
                </span>
              </button>
              <button className="chip">
                일정 초과
                <span className="chip-count">
                  {Object.values(board.board).flat().filter((t) => t.isOverdue).length}
                </span>
              </button>
            </div>

            <BoardContainer
              board={board}
              isLoading={isLoading}
              createTicket={createTicket}
              updateTicket={updateTicket}
              deleteTicket={deleteTicket}
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
