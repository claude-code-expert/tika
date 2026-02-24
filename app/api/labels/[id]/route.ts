import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { auth } from '@/lib/auth';
import { updateLabelSchema } from '@/lib/validations';
import { updateLabel, deleteLabel } from '@/db/queries/labels';

type RouteContext = { params: Promise<{ id: string }> };

function getWorkspaceId(session: Session | null): number | null {
  return ((session?.user as Record<string, unknown> | undefined)?.workspaceId as number) ?? null;
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
    const labelId = Number(id);
    if (isNaN(labelId)) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: '유효하지 않은 라벨 ID입니다' } },
        { status: 400 },
      );
    }

    const body = await request.json();
    const result = updateLabelSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: result.error.errors[0].message } },
        { status: 400 },
      );
    }

    const label = await updateLabel(labelId, workspaceId, result.data);
    if (!label) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: '라벨을 찾을 수 없습니다' } },
        { status: 404 },
      );
    }
    return NextResponse.json({ label });
  } catch (error) {
    console.error('PATCH /api/labels/:id error:', error);
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
    const labelId = Number(id);
    if (isNaN(labelId)) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: '유효하지 않은 라벨 ID입니다' } },
        { status: 400 },
      );
    }

    await deleteLabel(labelId, workspaceId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('DELETE /api/labels/:id error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 내부 오류가 발생했습니다' } },
      { status: 500 },
    );
  }
}
