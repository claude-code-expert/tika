import { NextRequest, NextResponse } from 'next/server';
import { getTicketById, updateTicket, deleteTicket } from '@/db/queries/tickets';
import { updateTicketSchema, ticketIdSchema } from '@/lib/validations';
import { addMeta } from '@/lib/utils';
import type { Ticket } from '@/types';

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/tickets/:id - 티켓 상세 조회
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const parsed = ticketIdSchema.safeParse({ id });
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: '유효한 티켓 ID가 필요합니다' } },
        { status: 400 },
      );
    }

    const ticket = await getTicketById(parsed.data.id);
    if (!ticket) {
      return NextResponse.json(
        { error: { code: 'TICKET_NOT_FOUND', message: 'Ticket not found' } },
        { status: 404 },
      );
    }

    return NextResponse.json(addMeta(ticket as Ticket));
  } catch (error) {
    console.error('GET /api/tickets/:id error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 },
    );
  }
}

// PATCH /api/tickets/:id - 티켓 수정
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const idParsed = ticketIdSchema.safeParse({ id });
    if (!idParsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: '유효한 티켓 ID가 필요합니다' } },
        { status: 400 },
      );
    }

    const body = await request.json();
    const parsed = updateTicketSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0].message } },
        { status: 400 },
      );
    }

    const ticket = await updateTicket(idParsed.data.id, parsed.data);
    if (!ticket) {
      return NextResponse.json(
        { error: { code: 'TICKET_NOT_FOUND', message: 'Ticket not found' } },
        { status: 404 },
      );
    }

    return NextResponse.json(addMeta(ticket as Ticket));
  } catch (error) {
    console.error('PATCH /api/tickets/:id error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 },
    );
  }
}

// DELETE /api/tickets/:id - 티켓 삭제
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const parsed = ticketIdSchema.safeParse({ id });
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: '유효한 티켓 ID가 필요합니다' } },
        { status: 400 },
      );
    }

    const result = await deleteTicket(parsed.data.id);
    if (!result) {
      return NextResponse.json(
        { error: { code: 'TICKET_NOT_FOUND', message: 'Ticket not found' } },
        { status: 404 },
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('DELETE /api/tickets/:id error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 },
    );
  }
}
