import { PRIORITY_COLORS, PRIORITY_LABELS } from '@/lib/constants';
import type { TicketPriority } from '@/types';

interface BadgeProps {
  priority: TicketPriority;
}

export function Badge({ priority }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_COLORS[priority]}`}
    >
      {PRIORITY_LABELS[priority]}
    </span>
  );
}
