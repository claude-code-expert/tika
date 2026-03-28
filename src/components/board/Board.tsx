'use client';

import type { BoardData, TicketWithMeta } from '@/types/index';
import { COLUMN_ORDER, COLUMN_LABELS } from '@/types/index';
import { Column } from './Column';

interface BoardProps {
  board: BoardData;
  onTicketClick: (ticket: TicketWithMeta) => void;
  currentMemberId?: number | null;
}

export function Board({ board, onTicketClick, currentMemberId }: BoardProps) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 16,
        padding: 20,
        overflowX: 'auto',
        background: 'var(--color-board-bg)',
        minHeight: '100%',
      }}
    >
      {COLUMN_ORDER.map((status) => (
        <Column
          key={status}
          status={status}
          label={COLUMN_LABELS[status] ?? status}
          tickets={board.board[status]}
          onTicketClick={onTicketClick}
          workspaceName={board.workspaceName}
          currentMemberId={currentMemberId}
        />
      ))}
    </div>
  );
}
