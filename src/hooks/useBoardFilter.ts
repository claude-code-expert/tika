'use client';

import { useState, useMemo, useCallback } from 'react';
import type { BoardData, TicketWithMeta, TicketPriority, TicketType } from '@/types/index';

export type ActiveFilter = 'all' | 'today_due' | 'overdue' | 'week_done';

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
  todayDueCount: number;
  overdueCount: number;
  weekDoneCount: number;
  total: number;
}

function localDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
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

  const todayStr = useMemo(() => localDateStr(new Date()), []);

  const todayDueCount = useMemo(
    () => allTickets.filter((t) => t.plannedEndDate === todayStr && t.status !== 'DONE').length,
    [allTickets, todayStr],
  );

  const overdueCount = useMemo(
    () => allTickets.filter((t) => t.isOverdue).length,
    [allTickets],
  );

  const weekStartStr = useMemo(() => {
    const now = new Date();
    const day = now.getDay();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - (day === 0 ? 6 : day - 1)); // Monday
    return localDateStr(weekStart);
  }, []);

  const weekDoneCount = useMemo(() => {
    return allTickets.filter((t) => {
      if (t.status !== 'DONE' || !t.completedAt) return false;
      const completedDate = t.completedAt.slice(0, 10);
      return completedDate >= weekStartStr;
    }).length;
  }, [allTickets, weekStartStr]);

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
      let df: (t: TicketWithMeta) => boolean;
      if (activeFilter === 'today_due') {
        df = (t) => t.plannedEndDate === todayStr && t.status !== 'DONE';
      } else if (activeFilter === 'overdue') {
        df = (t) => t.isOverdue;
      } else {
        // week_done
        df = (t) => t.status === 'DONE' && !!t.completedAt && t.completedAt.slice(0, 10) >= weekStartStr;
      }
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
        if (!t.plannedEndDate) return false;
        if (dueDateFrom && t.plannedEndDate < dueDateFrom) return false;
        if (dueDateTo && t.plannedEndDate > dueDateTo) return false;
        return true;
      });
    }

    const total = Object.values(base.board).reduce((s, arr) => s + arr.length, 0);
    return { ...base, total };
  }, [board, searchQuery, activeFilter, activePriorities, activeTypes, dueDateFrom, dueDateTo, todayStr, weekStartStr]);

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
      todayDueCount,
      overdueCount,
      weekDoneCount,
      total: board.total,
    },
  };
}
