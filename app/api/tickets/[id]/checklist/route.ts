import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { auth } from '@/lib/auth';
import { createChecklistItemSchema } from '@/lib/validations';
import { addChecklistItem } from '@/db/queries/checklist';
import { getTicketById } from '@/db/queries/tickets';

type RouteContext = { params: Promise<{ id: string }> };

function getWorkspaceId(session: Session | null): number | null {
  return ((session?.user as Record<string, unknown> | undefined)?.workspaceId as number) ?? null;
}

export async function POST(request: NextRequest, context: RouteContext) {
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

    const body = await request.json();
    const result = createChecklistItemSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: result.error.errors[0].message } },
        { status: 400 },
      );
    }

    const item = await addChecklistItem(ticketId, result.data.text);
    if ('error' in item) {
      return NextResponse.json(
        { error: { code: 'CHECKLIST_LIMIT_EXCEEDED', message: '체크리스트 항목은 최대 20개까지 추가할 수 있습니다' } },
        { status: 400 },
      );
    }

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error('POST /api/tickets/:id/checklist error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 내부 오류가 발생했습니다' } },
      { status: 500 },
    );
  }
}
