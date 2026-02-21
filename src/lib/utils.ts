import type { Ticket, TicketWithMeta, BoardData, TicketStatus } from '@/types';
import { TICKET_STATUS, COLUMN_ORDER } from '@/types';

/**
 * 오버듀 여부 판정
 * 마감일이 오늘 이전이고 DONE이 아닌 경우 true
 */
export function isOverdue(ticket: Ticket): boolean {
  if (!ticket.dueDate) return false;
  if (ticket.status === TICKET_STATUS.DONE) return false;
  const today = new Date().toISOString().split('T')[0];
  return ticket.dueDate < today;
}

/**
 * Ticket → TicketWithMeta 변환
 */
export function addMeta(ticket: Ticket): TicketWithMeta {
  return {
    ...ticket,
    isOverdue: isOverdue(ticket),
  };
}

/**
 * 티켓 배열을 BoardData 형태로 그룹화
 */
export function groupTicketsByStatus(ticketList: Ticket[]): BoardData {
  const board: BoardData = {
    [TICKET_STATUS.BACKLOG]: [],
    [TICKET_STATUS.TODO]: [],
    [TICKET_STATUS.IN_PROGRESS]: [],
    [TICKET_STATUS.DONE]: [],
  };

  for (const ticket of ticketList) {
    const status = ticket.status as TicketStatus;
    if (board[status]) {
      board[status].push(addMeta(ticket));
    }
  }

  return board;
}
