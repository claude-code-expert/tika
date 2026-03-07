import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { auth } from '@/lib/auth';
import { createTicketSchema } from '@/lib/validations';
import { getBoardData, createTicket, getTicketCount, getWbsTickets } from '@/db/queries/tickets';
import { setAssignees } from '@/db/queries/ticketAssignees';
import { TICKET_MAX_PER_WORKSPACE } from '@/lib/constants';

function getWorkspaceId(session: Session | null): number | null {
  return ((session?.user as Record<string, unknown> | undefined)?.workspaceId as number) ?? null;
}

export async function GET(request: NextRequest) {
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

    // ?types=GOAL,STORY,FEATURE → return flat ticket list filtered by type
    const { searchParams } = new URL(request.url);
    const typesParam = searchParams.get('types');
    if (typesParam) {
      const allowedTypes = typesParam.split(',').map((t) => t.trim().toUpperCase());
      const allTickets = await getWbsTickets(workspaceId);
      const filtered = allTickets.filter((t) => allowedTypes.includes(t.type));
      return NextResponse.json({ tickets: filtered });
    }

    const boardData = await getBoardData(workspaceId);
    return NextResponse.json(boardData);
  } catch (error) {
    console.error('GET /api/tickets error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 내부 오류가 발생했습니다' } },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const result = createTicketSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: result.error.errors[0].message } },
        { status: 400 },
      );
    }

    const ticketCount = await getTicketCount(workspaceId);
    if (ticketCount >= TICKET_MAX_PER_WORKSPACE) {
      return NextResponse.json(
        {
          error: {
            code: 'TICKET_LIMIT_EXCEEDED',
            message: `워크스페이스당 최대 ${TICKET_MAX_PER_WORKSPACE}개의 티켓만 생성할 수 있습니다`,
          },
        },
        { status: 400 },
      );
    }

    const { labelIds, assigneeIds, ...ticketData } = result.data;
    const ticket = await createTicket(workspaceId, { ...ticketData, labelIds });

    // Set multi-assignees if provided
    if (assigneeIds && assigneeIds.length > 0) {
      if (assigneeIds.length > 5) {
        return NextResponse.json(
          { error: { code: 'VALIDATION_ERROR', message: '담당자는 최대 5명까지 지정할 수 있습니다' } },
          { status: 400 },
        );
      }
      await setAssignees(ticket.id, assigneeIds);
    }

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (error) {
    console.error('POST /api/tickets error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 내부 오류가 발생했습니다' } },
      { status: 500 },
    );
  }
}
