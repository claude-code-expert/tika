import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { updateWorkspaceSchema } from '@/lib/validations';
import { getWorkspaceById, updateWorkspace } from '@/db/queries/workspaces';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' } },
        { status: 401 },
      );
    }

    const { id: idStr } = await params;
    const id = Number(idStr);
    if (Number.isNaN(id)) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: '유효하지 않은 워크스페이스 ID입니다' } },
        { status: 400 },
      );
    }

    const workspaceId = (session.user as Record<string, unknown>).workspaceId as number;
    if (workspaceId !== id) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: '이 워크스페이스를 수정할 권한이 없습니다' } },
        { status: 403 },
      );
    }

    const workspace = await getWorkspaceById(id);
    if (!workspace) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: '워크스페이스를 찾을 수 없습니다' } },
        { status: 404 },
      );
    }

    const body = await request.json();
    const parsed = updateWorkspaceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0]?.message ?? '입력 오류' } },
        { status: 400 },
      );
    }

    const updated = await updateWorkspace(id, parsed.data);
    return NextResponse.json({ workspace: updated });
  } catch (error) {
    console.error('PATCH /api/workspaces/[id] error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 },
    );
  }
}
