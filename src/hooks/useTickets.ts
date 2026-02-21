'use client';

import { useState, useCallback } from 'react';
import type {
  BoardData,
  TicketWithMeta,
  CreateTicketInput,
  UpdateTicketInput,
  TicketStatus,
} from '@/types';
import { TICKET_STATUS } from '@/types';
import { addMeta } from '@/lib/utils';
import type { Ticket } from '@/types';

export function useTickets(initialData: BoardData) {
  const [board, setBoard] = useState<BoardData>(initialData);

  // --- 티켓 생성 ---
  const createTicket = useCallback(async (input: CreateTicketInput) => {
    const res = await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    if (!res.ok) throw new Error('티켓 생성에 실패했습니다');

    const ticket = await res.json();
    const withMeta = addMeta(ticket as Ticket);

    setBoard((prev) => ({
      ...prev,
      [TICKET_STATUS.BACKLOG]: [withMeta, ...prev[TICKET_STATUS.BACKLOG]],
    }));

    return withMeta;
  }, []);

  // --- 티켓 수정 ---
  const updateTicket = useCallback(async (id: number, input: UpdateTicketInput) => {
    const res = await fetch(`/api/tickets/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    if (!res.ok) throw new Error('티켓 수정에 실패했습니다');

    const updated = await res.json();
    const withMeta = addMeta(updated as Ticket);

    setBoard((prev) => {
      const newBoard = { ...prev };
      for (const status of Object.keys(newBoard) as TicketStatus[]) {
        newBoard[status] = newBoard[status].map((t) => (t.id === id ? withMeta : t));
      }
      return newBoard;
    });

    return withMeta;
  }, []);

  // --- 티켓 삭제 ---
  const deleteTicket = useCallback(async (id: number) => {
    const res = await fetch(`/api/tickets/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('티켓 삭제에 실패했습니다');

    setBoard((prev) => {
      const newBoard = { ...prev };
      for (const status of Object.keys(newBoard) as TicketStatus[]) {
        newBoard[status] = newBoard[status].filter((t) => t.id !== id);
      }
      return newBoard;
    });
  }, []);

  // --- 드래그앤드롭 (낙관적 업데이트) ---
  const moveTicket = useCallback(
    async (ticketId: number, newStatus: TicketStatus, newIndex: number) => {
      // 이전 상태 백업 (롤백용)
      const prevBoard = { ...board };
      for (const s of Object.keys(prevBoard) as TicketStatus[]) {
        prevBoard[s] = [...prevBoard[s]];
      }

      // 낙관적 업데이트: 즉시 UI 반영
      setBoard((prev) => {
        const newBoard = { ...prev };
        for (const s of Object.keys(newBoard) as TicketStatus[]) {
          newBoard[s] = [...newBoard[s]];
        }

        // 기존 위치에서 제거
        let movedTicket: TicketWithMeta | undefined;
        for (const s of Object.keys(newBoard) as TicketStatus[]) {
          const idx = newBoard[s].findIndex((t) => t.id === ticketId);
          if (idx !== -1) {
            movedTicket = newBoard[s][idx];
            newBoard[s].splice(idx, 1);
            break;
          }
        }

        if (!movedTicket) return prev;

        // 새 위치에 삽입
        const updatedTicket: TicketWithMeta = {
          ...movedTicket,
          status: newStatus,
          completedAt: newStatus === TICKET_STATUS.DONE ? new Date() : null,
          isOverdue:
            newStatus !== TICKET_STATUS.DONE &&
            !!movedTicket.dueDate &&
            movedTicket.dueDate < new Date().toISOString().split('T')[0],
        };

        newBoard[newStatus].splice(newIndex, 0, updatedTicket);

        return newBoard;
      });

      // API 호출
      try {
        const res = await fetch('/api/tickets/reorder', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticketId, status: newStatus, position: newIndex }),
        });

        if (!res.ok) throw new Error('순서 변경 실패');
      } catch {
        // 롤백
        setBoard(prevBoard);
      }
    },
    [board],
  );

  return {
    board,
    setBoard,
    createTicket,
    updateTicket,
    deleteTicket,
    moveTicket,
  };
}
