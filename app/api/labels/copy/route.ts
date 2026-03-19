import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { auth } from '@/lib/auth';
import { copyLabelsSchema } from '@/lib/validations';
import { copyLabelsToWorkspace } from '@/db/queries/labels';
import { getMemberByUserId } from '@/db/queries/members';

function getWorkspaceId(session: Session | null): number | null {
  return ((session?.user as Record<string, unknown> | undefined)?.workspaceId as number) ?? null;
}

// POST /api/labels/copy — copy labels from current workspace to a target workspace
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' } },
        { status: 401 },
      );
    }

    const sourceWorkspaceId = getWorkspaceId(session);
    if (!sourceWorkspaceId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '워크스페이스를 찾을 수 없습니다' } },
        { status: 401 },
      );
    }

    const body = await request.json();
    const result = copyLabelsSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: result.error.errors[0].message } },
        { status: 400 },
      );
    }

    const { targetWorkspaceId, labelIds } = result.data;

    if (targetWorkspaceId === sourceWorkspaceId) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: '같은 워크스페이스로는 복사할 수 없습니다' } },
        { status: 400 },
      );
    }

    // Verify user is a member of the target workspace
    const userId = session.user.id as string;
    const targetMember = await getMemberByUserId(userId, targetWorkspaceId);
    if (!targetMember) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: '대상 워크스페이스에 접근 권한이 없습니다' } },
        { status: 403 },
      );
    }

    const { copied, skipped } = await copyLabelsToWorkspace(labelIds, sourceWorkspaceId, targetWorkspaceId);

    return NextResponse.json({ copied, skipped }, { status: 200 });
  } catch (error) {
    console.error('POST /api/labels/copy error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 내부 오류가 발생했습니다' } },
      { status: 500 },
    );
  }
}
