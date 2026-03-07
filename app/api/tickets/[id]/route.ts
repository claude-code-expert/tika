import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { auth } from '@/lib/auth';
import { updateTicketSchema } from '@/lib/validations';
import { getTicketById, updateTicket, deleteTicket } from '@/db/queries/tickets';
import { setAssignees, getAssigneesByTicket } from '@/db/queries/ticketAssignees';

type RouteContext = { params: Promise<{ id: string }> };

function getWorkspaceId(session: Session | null): number | null {
  return ((session?.user as Record<string, unknown> | undefined)?.workspaceId as number) ?? null;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' } },
        { status: 401 },
      );
    }
    const workspaceId = getWorkspaceId(session);
    if (!workspaceId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '워크스페이스를 찾을 수 없습니다' } },
        { status: 401 },
      );
    }

    const { id } = await context.params;
    const ticketId = Number(id);
    if (isNaN(ticketId)) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: '유효하지 않은 티켓 ID입니다' } },
        { status: 400 },
      );
    }

    const ticket = await getTicketById(ticketId, workspaceId);
    if (!ticket) {
      return NextResponse.json(
        { error: { code: 'TICKET_NOT_FOUND', message: '티켓을 찾을 수 없습니다' } },
        { status: 404 },
      );
    }
    return NextResponse.json({ ticket });
  } catch (error) {
    console.error('GET /api/tickets/:id error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 내부 오류가 발생했습니다' } },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' } },
        { status: 401 },
      );
    }
    const workspaceId = getWorkspaceId(session);
    if (!workspaceId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '워크스페이스를 찾을 수 없습니다' } },
        { status: 401 },
      );
    }

    const { id } = await context.params;
    const ticketId = Number(id);
    if (isNaN(ticketId)) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: '유효하지 않은 티켓 ID입니다' } },
        { status: 400 },
      );
    }

    const body = await request.json();
    const result = updateTicketSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: result.error.errors[0].message } },
        { status: 400 },
      );
    }

    // Handle status change side effects (startDate, completedAt)
    let completedAt: Date | null | undefined = undefined;
    let startDate: string | null | undefined = undefined;

    if (result.data.status !== undefined) {
      const existing = await getTicketById(ticketId, workspaceId);
      if (existing) {
        // Auto-set startDate when moving out of BACKLOG (to TODO/IN_PROGRESS/DONE)
        if (
          result.data.status !== 'BACKLOG' &&
          existing.status === 'BACKLOG' &&
          !existing.startDate
        ) {
          startDate = new Date().toISOString().slice(0, 10);
        }
      }

      if (result.data.status === 'DONE') completedAt = new Date();
      else completedAt = null;
    }

    const { assigneeIds, ...restData } = result.data;

    // Validate multi-assignees before update
    if (assigneeIds !== undefined && assigneeIds.length > 5) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: '담당자는 최대 5명까지 지정할 수 있습니다' } },
        { status: 400 },
      );
    }

    const ticket = await updateTicket(ticketId, workspaceId, {
      ...restData,
      completedAt,
      ...(startDate !== undefined ? { startDate } : {}),
    });

    if (!ticket) {
      return NextResponse.json(
        { error: { code: 'TICKET_NOT_FOUND', message: '티켓을 찾을 수 없습니다' } },
        { status: 404 },
      );
    }

    // Update multi-assignees if provided
    if (assigneeIds !== undefined) {
      await setAssignees(ticketId, assigneeIds);
    }

    const assignees = await getAssigneesByTicket(ticketId);
    return NextResponse.json({ ticket: { ...ticket, assignees } });
  } catch (error) {
    console.error('PATCH /api/tickets/:id error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 내부 오류가 발생했습니다' } },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' } },
        { status: 401 },
      );
    }
    const workspaceId = getWorkspaceId(session);
    if (!workspaceId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '워크스페이스를 찾을 수 없습니다' } },
        { status: 401 },
      );
    }

    const { id } = await context.params;
    const ticketId = Number(id);
    if (isNaN(ticketId)) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: '유효하지 않은 티켓 ID입니다' } },
        { status: 400 },
      );
    }

    const deleted = await deleteTicket(ticketId, workspaceId);
    if (!deleted) {
      return NextResponse.json(
        { error: { code: 'TICKET_NOT_FOUND', message: '티켓을 찾을 수 없습니다' } },
        { status: 404 },
      );
    }
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('DELETE /api/tickets/:id error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 내부 오류가 발생했습니다' } },
      { status: 500 },
    );
  }
}
