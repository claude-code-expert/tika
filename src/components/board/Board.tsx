'use client';

import type { BoardData, TicketStatus, TicketWithMeta } from '@/types/index';
import { Column } from './Column';
import { TICKET_STATUS } from '@/types/index';

const COLUMN_ORDER: TicketStatus[] = [
  TICKET_STATUS.TODO,
  TICKET_STATUS.IN_PROGRESS,
  TICKET_STATUS.DONE,
];

const COLUMN_LABELS: Partial<Record<TicketStatus, string>> = {
  TODO: 'TODO',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
};

interface BoardProps {
  board: BoardData;
  onTicketClick: (ticket: TicketWithMeta) => void;
}

export function Board({ board, onTicketClick }: BoardProps) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        gap: 'var(--spacing-column-gap)',
        padding: 16,
        overflowX: 'auto',
        overflowY: 'hidden',
        background: 'var(--color-board-bg)',
      }}
    >
      {COLUMN_ORDER.map((status) => (
        <Column
          key={status}
          status={status}
          label={COLUMN_LABELS[status] ?? status}
          tickets={board.board[status]}
          onTicketClick={onTicketClick}
        />
      ))}
    </div>
  );
}
