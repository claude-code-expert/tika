'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import type { BoardData, TicketWithMeta, TicketStatus } from '@/types/index';
import type { CreateTicketInput, UpdateTicketInput } from '@/lib/validations';
import { applyOptimisticMove } from '@/lib/utils';

const EMPTY_BOARD: BoardData = {
  board: { BACKLOG: [], TODO: [], IN_PROGRESS: [], DONE: [] },
  total: 0,
};

export function useTickets(initialData?: BoardData) {
  const [board, setBoard] = useState<BoardData>(initialData ?? EMPTY_BOARD);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeLabels, setActiveLabels] = useState<number[]>([]); // T057: label filter

  const fetchBoard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/tickets');
      if (!res.ok) throw new Error('보드 데이터를 불러오지 못했습니다');
      const data: BoardData = await res.json();
      setBoard(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch board data on mount if no initialData was provided
  useEffect(() => {
    if (!initialData) {
      fetchBoard();
    }
  }, [initialData, fetchBoard]);

  const createTicket = useCallback(
    async (data: CreateTicketInput) => {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message ?? '티켓 생성에 실패했습니다');
      }
      const { ticket } = await res.json();
      setBoard((prev) => ({
        ...prev,
        total: prev.total + 1,
        board: {
          ...prev.board,
          BACKLOG: [
            { ...ticket, isOverdue: false, labels: [], checklistItems: [], issue: null, assignee: null },
            ...prev.board.BACKLOG,
          ],
        },
      }));
      return ticket;
    },
    [],
  );

  const updateTicket = useCallback(
    async (id: number, data: UpdateTicketInput) => {
      const res = await fetch(`/api/tickets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message ?? '티켓 수정에 실패했습니다');
      }
      const { ticket } = await res.json();
      setBoard((prev) => {
        const newBoard = { ...prev.board };
        for (const status of Object.keys(newBoard) as TicketStatus[]) {
          newBoard[status] = newBoard[status].map((t) =>
            t.id === id ? { ...t, ...ticket } : t,
          );
        }
        return { ...prev, board: newBoard };
      });
      return ticket;
    },
    [],
  );

  const deleteTicket = useCallback(async (id: number) => {
    const res = await fetch(`/api/tickets/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message ?? '티켓 삭제에 실패했습니다');
    }
    setBoard((prev) => {
      const newBoard = { ...prev.board };
      let removed = false;
      for (const status of Object.keys(newBoard) as TicketStatus[]) {
        const filtered = newBoard[status].filter((t) => t.id !== id);
        if (filtered.length !== newBoard[status].length) removed = true;
        newBoard[status] = filtered;
      }
      return { ...prev, total: removed ? prev.total - 1 : prev.total, board: newBoard };
    });
  }, []);

  const reorder = useCallback(
    async (ticketId: number, targetStatus: TicketStatus, targetIndex: number) => {
      const snapshot = JSON.parse(JSON.stringify(board)) as BoardData;
      setBoard((prev) => applyOptimisticMove(prev, ticketId, targetStatus, targetIndex));

      try {
        const res = await fetch('/api/tickets/reorder', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticketId, targetStatus, targetIndex }),
        });
        if (!res.ok) {
          setBoard(snapshot);
          const err = await res.json();
          throw new Error(err.error?.message ?? '순서 변경에 실패했습니다');
        }
        // Refresh board to reflect actual DB positions
        await fetchBoard();
      } catch (err) {
        setBoard(snapshot);
        throw err;
      }
    },
    [board, fetchBoard],
  );

  // T057: filteredBoard — only show tickets that include ALL activeLabels
  const filteredBoard = useMemo((): BoardData => {
    if (activeLabels.length === 0) return board;
    const filterFn = (t: TicketWithMeta) =>
      activeLabels.every((id) => t.labels.some((l) => l.id === id));
    const newBoard: BoardData['board'] = {
      BACKLOG: board.board.BACKLOG.filter(filterFn),
      TODO: board.board.TODO.filter(filterFn),
      IN_PROGRESS: board.board.IN_PROGRESS.filter(filterFn),
      DONE: board.board.DONE.filter(filterFn),
    };
    return { ...board, board: newBoard };
  }, [board, activeLabels]);

  const toggleLabel = useCallback((labelId: number) => {
    setActiveLabels((prev) =>
      prev.includes(labelId) ? prev.filter((id) => id !== labelId) : [...prev, labelId],
    );
  }, []);

  const clearLabels = useCallback(() => setActiveLabels([]), []);

  return {
    board,
    filteredBoard,
    isLoading,
    error,
    activeLabels,
    toggleLabel,
    clearLabels,
    fetchBoard,
    createTicket,
    updateTicket,
    deleteTicket,
    reorder,
  };
}
