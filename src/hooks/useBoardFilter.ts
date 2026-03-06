'use client';

import { useState, useMemo, useCallback } from 'react';
import type { BoardData, TicketWithMeta, TicketPriority, TicketType } from '@/types/index';

export type ActiveFilter = 'all' | 'this_week' | 'overdue';

export interface BoardFilterState {
  activeFilter: ActiveFilter;
  setActiveFilter: (f: ActiveFilter) => void;
  showAdvancedFilter: boolean;
  toggleAdvancedFilter: () => void;
  activePriorities: TicketPriority[];
  togglePriority: (p: TicketPriority) => void;
  activeTypes: TicketType[];
  toggleType: (t: TicketType) => void;
  dueDateFrom: string;
  setDueDateFrom: (v: string) => void;
  dueDateTo: string;
  setDueDateTo: (v: string) => void;
  hasActiveFilters: boolean;
  clearAllFilters: () => void;
  thisWeekCount: number;
  overdueCount: number;
  total: number;
}

function applyFilter(board: BoardData, filterFn: (t: TicketWithMeta) => boolean): BoardData {
  return {
    ...board,
    board: {
      BACKLOG: board.board.BACKLOG.filter(filterFn),
      TODO: board.board.TODO.filter(filterFn),
      IN_PROGRESS: board.board.IN_PROGRESS.filter(filterFn),
      DONE: board.board.DONE.filter(filterFn),
    },
  };
}

export function useBoardFilter(
  board: BoardData,
  searchQuery = '',
): { displayBoard: BoardData; filter: BoardFilterState } {
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [activePriorities, setActivePriorities] = useState<TicketPriority[]>([]);
  const [activeTypes, setActiveTypes] = useState<TicketType[]>([]);
  const [dueDateFrom, setDueDateFrom] = useState('');
  const [dueDateTo, setDueDateTo] = useState('');

  const allTickets = useMemo(() => Object.values(board.board).flat(), [board]);

  const thisWeekCount = useMemo(() => {
    const now = new Date();
    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() + (6 - now.getDay()));
    return allTickets.filter((t) => {
      if (!t.dueDate) return false;
      const due = new Date(t.dueDate);
      return due >= now && due <= weekEnd;
    }).length;
  }, [allTickets]);

  const overdueCount = useMemo(
    () => allTickets.filter((t) => t.isOverdue).length,
    [allTickets],
  );

  const hasActiveFilters =
    activeFilter !== 'all' ||
    activePriorities.length > 0 ||
    activeTypes.length > 0 ||
    !!(dueDateFrom || dueDateTo);

  const clearAllFilters = useCallback(() => {
    setActiveFilter('all');
    setActivePriorities([]);
    setActiveTypes([]);
    setDueDateFrom('');
    setDueDateTo('');
    setShowAdvancedFilter(false);
  }, []);

  const togglePriority = useCallback((p: TicketPriority) => {
    setActivePriorities((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  }, []);

  const toggleType = useCallback((t: TicketType) => {
    setActiveTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }, []);

  const toggleAdvancedFilter = useCallback(() => setShowAdvancedFilter((p) => !p), []);

  const displayBoard = useMemo((): BoardData => {
    let base = board;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      base = applyFilter(
        base,
        (t) =>
          t.title.toLowerCase().includes(q) || (t.description?.toLowerCase().includes(q) ?? false),
      );
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
      base = applyFilter(base, df);
    }

    if (activePriorities.length > 0) {
      base = applyFilter(base, (t) => activePriorities.includes(t.priority));
    }

    if (activeTypes.length > 0) {
      base = applyFilter(base, (t) => activeTypes.includes(t.type));
    }

    if (dueDateFrom || dueDateTo) {
      base = applyFilter(base, (t) => {
        if (!t.dueDate) return false;
        if (dueDateFrom && t.dueDate < dueDateFrom) return false;
        if (dueDateTo && t.dueDate > dueDateTo) return false;
        return true;
      });
    }

    const total = Object.values(base.board).reduce((s, arr) => s + arr.length, 0);
    return { ...base, total };
  }, [board, searchQuery, activeFilter, activePriorities, activeTypes, dueDateFrom, dueDateTo]);

  return {
    displayBoard,
    filter: {
      activeFilter,
      setActiveFilter,
      showAdvancedFilter,
      toggleAdvancedFilter,
      activePriorities,
      togglePriority,
      activeTypes,
      toggleType,
      dueDateFrom,
      setDueDateFrom,
      dueDateTo,
      setDueDateTo,
      hasActiveFilters,
      clearAllFilters,
      thisWeekCount,
      overdueCount,
      total: board.total,
    },
  };
}
