import { NextRequest, NextResponse } from 'next/server';
import { reorderTicket } from '@/db/queries/tickets';
import { reorderTicketSchema } from '@/lib/validations';

// PATCH /api/tickets/reorder - 드래그앤드롭 순서/상태 변경
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = reorderTicketSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } },
        { status: 400 },
      );
    }

    const ticket = await reorderTicket(parsed.data);
    if (!ticket) {
      return NextResponse.json(
        { error: { code: 'TICKET_NOT_FOUND', message: 'Ticket not found' } },
        { status: 404 },
      );
    }

    return NextResponse.json({ ticket });
  } catch (error) {
    console.error('PATCH /api/tickets/reorder error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 },
    );
  }
}
