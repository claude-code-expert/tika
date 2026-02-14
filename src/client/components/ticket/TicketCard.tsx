'use client';

import type { TicketWithMeta } from '@/shared/types';
import { PriorityBadge, DueDateBadge } from '@/client/components/ui/Badge';

interface TicketCardProps {
  ticket: TicketWithMeta;
  onClick: () => void;
}

export function TicketCard({ ticket, onClick }: TicketCardProps) {
  const cardClass = [
    'ticket-card',
    ticket.status === 'DONE' ? 'ticket-card--done' : '',
  ].filter(Boolean).join(' ');

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      className={cardClass}
      role="button"
      tabIndex={0}
      aria-label={`티켓: ${ticket.title}`}
      data-overdue={ticket.isOverdue}
      onClick={onClick}
      onKeyDown={handleKeyDown}
    >
      <span className="ticket-card__title ticket-card__title--truncate">{ticket.title}</span>
      <div className="ticket-card__meta">
        <PriorityBadge priority={ticket.priority} />
        {ticket.dueDate && (
          <DueDateBadge dueDate={ticket.dueDate} isOverdue={ticket.isOverdue} />
        )}
      </div>
    </div>
  );
}

export function TicketCardOverlay({ ticket }: { ticket: TicketWithMeta }) {
  return <div />;
}
