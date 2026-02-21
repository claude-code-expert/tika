import { NextRequest, NextResponse } from 'next/server';
import { getAllTickets, createTicket } from '@/db/queries/tickets';
import { createTicketSchema } from '@/lib/validations';
import { groupTicketsByStatus } from '@/lib/utils';

// GET /api/tickets - 전체 보드 조회
export async function GET() {
  try {
    const ticketList = await getAllTickets();
    const board = groupTicketsByStatus(ticketList as any);
    return NextResponse.json({ board, total: ticketList.length });
  } catch (error) {
    console.error('GET /api/tickets error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 },
    );
  }
}

// POST /api/tickets - 티켓 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createTicketSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: parsed.error.issues[0].message,
          },
        },
        { status: 400 },
      );
    }

    const ticket = await createTicket(parsed.data);
    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    console.error('POST /api/tickets error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 },
    );
  }
}
