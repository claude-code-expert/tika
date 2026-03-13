import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { requireRole, isRoleError } from '@/lib/permissions';
import { transferOwnerSchema } from '@/lib/validations';
import { transferOwnership } from '@/db/queries/members';
import { TEAM_ROLE } from '@/types/index';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' } }, { status: 401 });
    }
    const { id } = await params;
    const workspaceId = Number(id);
    if (isNaN(workspaceId)) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: '잘못된 워크스페이스 ID' } }, { status: 400 });
    }

    const roleCheck = await requireRole(session.user.id, workspaceId, TEAM_ROLE.OWNER);
    if (isRoleError(roleCheck)) return roleCheck;

    const body = await request.json();
    const parsed = transferOwnerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: '입력값이 올바르지 않습니다' } }, { status: 400 });
    }

    await transferOwnership(workspaceId, session.user.id, parsed.data.targetMemberId);
    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : '서버 오류가 발생했습니다';
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: msg } }, { status: 500 });
  }
}
