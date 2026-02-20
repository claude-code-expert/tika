'use client';

import { Column } from './Column';
import { COLUMN_ORDER } from '@/types';
import type { BoardData, TicketWithMeta } from '@/types';

interface BoardProps {
  board: BoardData;
  onTicketClick: (ticket: TicketWithMeta) => void;
}

export function Board({ board, onTicketClick }: BoardProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {COLUMN_ORDER.map((status) => (
        <Column
          key={status}
          status={status}
          tickets={board[status]}
          onTicketClick={onTicketClick}
        />
      ))}
    </div>
  );
}
