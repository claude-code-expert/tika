'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Badge } from '@/components/ui/Badge';
import type { TicketWithMeta } from '@/types';

interface TicketCardProps {
  ticket: TicketWithMeta;
  onClick: () => void;
}

export function TicketCard({ ticket, onClick }: TicketCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: ticket.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      role="button"
      aria-label={`티켓: ${ticket.title}`}
      className={`cursor-pointer rounded-lg border bg-white p-3 shadow-sm transition-shadow hover:shadow-md ${
        isDragging ? 'opacity-50 shadow-lg' : ''
      } ${ticket.isOverdue ? 'border-red-300 bg-red-50/30' : 'border-gray-200'}`}
    >
      {/* 제목 */}
      <p className="truncate text-sm font-medium text-gray-900">{ticket.title}</p>

      {/* 메타 정보 */}
      <div className="mt-2 flex items-center gap-2">
        <Badge priority={ticket.priority} />

        {ticket.dueDate && (
          <span
            className={`text-xs ${ticket.isOverdue ? 'font-medium text-red-600' : 'text-gray-500'}`}
          >
            {ticket.isOverdue && '⚠ '}
            {ticket.dueDate}
          </span>
        )}
      </div>
    </div>
  );
}
