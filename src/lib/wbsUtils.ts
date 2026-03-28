import type { GanttItem } from '@/components/team/GanttChart';
import { nowKST } from '@/lib/date';
import type { TicketWithMeta } from '@/types/index';

// ── Hierarchy builder (used by WBS page server component) ──────────────────

export function buildGanttItems(wbsTickets: TicketWithMeta[]): GanttItem[] {
  const map = new Map<number, GanttItem>();

  for (const t of wbsTickets) {
    map.set(t.id, {
      id: t.id,
      type: t.type,
      name: t.title,
      status: t.status,
      priority: t.priority,
      assignees: t.assignees,
      startDate: t.plannedStartDate ?? null,
      endDate: t.plannedEndDate ?? null,
      children: [],
    });
  }

  const roots: GanttItem[] = [];
  for (const t of wbsTickets) {
    const node = map.get(t.id)!;
    if (t.parentId && map.has(t.parentId)) {
      map.get(t.parentId)!.children!.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

// ── Date utilities (used by WbsClient) ────────────────────────────────────

export function getAllDates(items: GanttItem[]): string[] {
  const dates: string[] = [];
  for (const item of items) {
    if (item.startDate) dates.push(item.startDate);
    if (item.endDate)   dates.push(item.endDate);
    if (item.children)  dates.push(...getAllDates(item.children));
  }
  return dates;
}

export function getDateRange(items: GanttItem[]): { start: string; end: string } {
  const dates = getAllDates(items).sort();
  if (dates.length === 0) {
    const t = nowKST().toISOString().slice(0, 10);
    return { start: t, end: new Date(nowKST().getTime() + 30 * 86400000).toISOString().slice(0, 10) };
  }
  const s = new Date(dates[0]);
  s.setDate(s.getDate() - 3);
  const e = new Date(dates[dates.length - 1]);
  e.setDate(e.getDate() + 7);
  return { start: s.toISOString().slice(0, 10), end: e.toISOString().slice(0, 10) };
}

export function getActualDateRange(items: GanttItem[]): { start: string | null; end: string | null } {
  const dates = getAllDates(items).sort();
  if (dates.length === 0) return { start: null, end: null };
  return { start: dates[0], end: dates[dates.length - 1] };
}

export function countItems(items: GanttItem[]): { total: number; done: number } {
  let total = 0, done = 0;
  for (const item of items) {
    total++;
    if (item.status === 'DONE') done++;
    if (item.children) {
      const sub = countItems(item.children);
      total += sub.total;
      done  += sub.done;
    }
  }
  return { total, done };
}
