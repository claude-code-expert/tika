'use client';

import type { TicketPriority } from '@/shared/types';

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  const label = priority.charAt(0) + priority.slice(1).toLowerCase();
  return <span data-priority={priority}>{label}</span>;
}

export function DueDateBadge({ dueDate, isOverdue }: { dueDate: string; isOverdue: boolean }) {
  return <span>{dueDate}</span>;
}
