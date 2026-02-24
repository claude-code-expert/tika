import type { BoardData, Ticket, TicketStatus, TicketWithMeta } from '@/types/index';
import { TICKET_STATUS } from '@/types/index';
import { POSITION_GAP } from './constants';

export function isOverdue(dueDate: string | null, status: TicketStatus): boolean {
  if (!dueDate || status === TICKET_STATUS.DONE) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dueDate) < today;
}

export function groupTicketsByStatus(
  tickets: TicketWithMeta[],
): Record<TicketStatus, TicketWithMeta[]> {
  const grouped: Record<TicketStatus, TicketWithMeta[]> = {
    BACKLOG: [],
    TODO: [],
    IN_PROGRESS: [],
    DONE: [],
  };
  for (const ticket of tickets) {
    grouped[ticket.status].push(ticket);
  }
  for (const status of Object.keys(grouped) as TicketStatus[]) {
    grouped[status].sort((a, b) => a.position - b.position);
  }
  return grouped;
}

export function calculatePosition(above: number | null, below: number | null): number {
  if (above === null && below === null) return 0;
  if (above === null) return (below as number) - POSITION_GAP;
  if (below === null) return (above as number) + POSITION_GAP;
  return Math.floor((above + below) / 2);
}

export function applyOptimisticMove(
  board: BoardData,
  ticketId: number,
  targetStatus: TicketStatus,
  targetIndex: number,
): BoardData {
  let movedTicket: TicketWithMeta | null = null;
  const newBoard: Record<TicketStatus, TicketWithMeta[]> = {
    BACKLOG: [],
    TODO: [],
    IN_PROGRESS: [],
    DONE: [],
  };

  for (const status of Object.keys(board.board) as TicketStatus[]) {
    newBoard[status] = board.board[status].filter((t) => {
      if (t.id === ticketId) {
        movedTicket = { ...t, status: targetStatus };
        return false;
      }
      return true;
    });
  }

  if (!movedTicket) return board;

  const targetCol = [...newBoard[targetStatus]];
  const clampedIndex = Math.min(targetIndex, targetCol.length);
  targetCol.splice(clampedIndex, 0, movedTicket as TicketWithMeta);
  newBoard[targetStatus] = targetCol;

  return { ...board, board: newBoard };
}

export function rebalancePositions(tickets: Ticket[]): Array<{ id: number; position: number }> {
  return tickets
    .sort((a, b) => a.position - b.position)
    .map((t, i) => ({ id: t.id, position: (i + 1) * POSITION_GAP }));
}
