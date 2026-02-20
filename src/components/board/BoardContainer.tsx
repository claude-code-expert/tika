'use client';

import { useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { Board } from './Board';
import { TicketCard } from './TicketCard';
import { TicketForm } from '@/components/ticket/TicketForm';
import { TicketModal } from '@/components/ticket/TicketModal';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useTickets } from '@/hooks/useTickets';
import type { BoardData, TicketWithMeta, TicketStatus, CreateTicketInput, UpdateTicketInput } from '@/types';
import { COLUMN_ORDER } from '@/types';

interface BoardContainerProps {
  initialData: BoardData;
}

export function BoardContainer({ initialData }: BoardContainerProps) {
  const { board, createTicket, updateTicket, deleteTicket, moveTicket } = useTickets(initialData);
  const [activeTicket, setActiveTicket] = useState<TicketWithMeta | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<TicketWithMeta | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isCreateLoading, setIsCreateLoading] = useState(false);

  // DnD 센서 설정 (클릭과 드래그 구분)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      const ticketId = active.id as number;

      for (const status of COLUMN_ORDER) {
        const found = board[status].find((t) => t.id === ticketId);
        if (found) {
          setActiveTicket(found);
          break;
        }
      }
    },
    [board],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveTicket(null);

      if (!over) return;

      const ticketId = active.id as number;
      const overId = over.id;

      // 드롭 대상이 칼럼인지 다른 카드인지 판별
      let targetStatus: TicketStatus;
      let targetIndex: number;

      if (COLUMN_ORDER.includes(overId as TicketStatus)) {
        // 빈 칼럼에 드롭
        targetStatus = overId as TicketStatus;
        targetIndex = 0;
      } else {
        // 다른 카드 위에 드롭 → 해당 카드의 칼럼과 위치 찾기
        for (const status of COLUMN_ORDER) {
          const idx = board[status].findIndex((t) => t.id === overId);
          if (idx !== -1) {
            targetStatus = status;
            targetIndex = idx;
            break;
          }
        }
        if (!targetStatus!) return;
      }

      moveTicket(ticketId, targetStatus, targetIndex);
    },
    [board, moveTicket],
  );

  const handleCreate = async (data: CreateTicketInput) => {
    setIsCreateLoading(true);
    try {
      await createTicket(data);
      setIsCreating(false);
    } finally {
      setIsCreateLoading(false);
    }
  };

  const handleUpdate = async (id: number, data: UpdateTicketInput) => {
    await updateTicket(id, data);
  };

  const handleDelete = async (id: number) => {
    await deleteTicket(id);
    setSelectedTicket(null);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 헤더 */}
      <header className="border-b bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Tika</h1>
            <p className="text-xs text-gray-500">Ticket-based Kanban Board</p>
          </div>
          <Button onClick={() => setIsCreating(true)}>+ 새 티켓</Button>
        </div>
      </header>

      {/* 보드 */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <Board board={board} onTicketClick={setSelectedTicket} />

          {/* 드래그 중 오버레이 */}
          <DragOverlay>
            {activeTicket && (
              <div className="rotate-3 opacity-90">
                <TicketCard ticket={activeTicket} onClick={() => {}} />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </main>

      {/* 생성 모달 */}
      <Modal isOpen={isCreating} onClose={() => setIsCreating(false)} title="새 티켓 만들기">
        <TicketForm
          mode="create"
          onSubmit={(data) => handleCreate(data as CreateTicketInput)}
          onCancel={() => setIsCreating(false)}
          isLoading={isCreateLoading}
        />
      </Modal>

      {/* 상세/수정 모달 */}
      {selectedTicket && (
        <TicketModal
          ticket={selectedTicket}
          isOpen={!!selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
