import { BoardContainer } from '@/components/board/BoardContainer';
import { getAllTickets } from '@/db/queries/tickets';
import { groupTicketsByStatus } from '@/lib/utils';
import type { Ticket } from '@/types';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const tickets = await getAllTickets();
  const board = groupTicketsByStatus(tickets as Ticket[]);

  return <BoardContainer initialData={board} />;
}
