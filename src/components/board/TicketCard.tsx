'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { TicketWithMeta } from '@/types/index';
import { Badge } from '@/components/ui/Badge';

const TYPE_LABELS = {
  GOAL: 'G',
  STORY: 'S',
  FEATURE: 'F',
  TASK: 'T',
} as const;

const TYPE_COLORS = {
  GOAL: 'bg-purple-100 text-purple-700',
  STORY: 'bg-blue-100 text-blue-700',
  FEATURE: 'bg-teal-100 text-teal-700',
  TASK: 'bg-gray-100 text-gray-600',
} as const;

const PRIORITY_LABELS = {
  LOW: 'Low',
  MEDIUM: 'Med',
  HIGH: 'High',
  CRITICAL: 'Crit',
} as const;

interface TicketCardProps {
  ticket: TicketWithMeta;
  onClick?: () => void;
}

export function TicketCard({ ticket, onClick }: TicketCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: ticket.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const completedCount = ticket.checklistItems.filter((c) => c.isCompleted).length;
  const totalCount = ticket.checklistItems.length;

  const handleClick = () => {
    if (!isDragging) onClick?.();
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`cursor-pointer rounded-lg bg-white p-3 shadow-sm transition hover:shadow-md ${
        ticket.isOverdue ? 'ring-2 ring-red-400' : ''
      } ${isDragging ? 'z-50' : ''}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !isDragging) handleClick();
      }}
      aria-label={`티켓: ${ticket.title}`}
    >
      {/* Type + Priority row */}
      <div className="mb-2 flex items-center gap-1.5">
        <span
          className={`inline-flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold ${TYPE_COLORS[ticket.type]}`}
        >
          {TYPE_LABELS[ticket.type]}
        </span>
        <Badge variant={ticket.priority} size="sm">
          {PRIORITY_LABELS[ticket.priority]}
        </Badge>
        {ticket.isOverdue && (
          <span className="ml-auto text-xs text-red-500" aria-label="마감 초과">
            ⚠
          </span>
        )}
      </div>

      {/* Title */}
      <p className="mb-2 line-clamp-1 text-sm font-medium text-gray-800">{ticket.title}</p>

      {/* Labels (max 3) */}
      {ticket.labels.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {ticket.labels.slice(0, 3).map((label) => (
            <span
              key={label.id}
              className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
              style={{ backgroundColor: label.color + '22', color: label.color }}
            >
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: label.color }}
              />
              {label.name}
            </span>
          ))}
          {ticket.labels.length > 3 && (
            <span className="text-[10px] text-gray-400">+{ticket.labels.length - 3}</span>
          )}
        </div>
      )}

      {/* Issue tag */}
      {ticket.issue && (
        <div className="mb-2">
          <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] text-indigo-600">
            {ticket.issue.name}
          </span>
        </div>
      )}

      {/* Footer: due date + checklist + assignee */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {ticket.dueDate && (
            <span className={`text-[10px] ${ticket.isOverdue ? 'text-red-500' : 'text-gray-400'}`}>
              {ticket.dueDate}
            </span>
          )}
          {totalCount > 0 && (
            <span className="text-[10px] text-gray-400">
              {completedCount}/{totalCount}
            </span>
          )}
        </div>
        {ticket.assignee && (
          <span
            className="flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold text-white"
            style={{ backgroundColor: ticket.assignee.color }}
            title={ticket.assignee.displayName}
          >
            {ticket.assignee.displayName.slice(0, 2).toUpperCase()}
          </span>
        )}
      </div>
    </div>
  );
}
