import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getInvitesByWorkspace, createInvite } from '@/db/queries/invites';
import { requireRole, isRoleError } from '@/lib/permissions';
import { createInviteSchema } from '@/lib/validations';
import { TEAM_ROLE } from '@/types/index';

// GET /api/workspaces/:id/invites — list invites (RBAC: OWNER)
export async function GET(
  _request: NextRequest,
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
    const workspaceId = Number(idStr);
    if (Number.isNaN(workspaceId)) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: '유효하지 않은 워크스페이스 ID입니다' } },
        { status: 400 },
      );
    }

    const userId = session.user.id as string;
    const check = await requireRole(userId, workspaceId, TEAM_ROLE.OWNER);
    if (isRoleError(check)) return check;

    const invites = await getInvitesByWorkspace(workspaceId);
    return NextResponse.json({ invites });
  } catch (error) {
    console.error('GET /api/workspaces/:id/invites error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 },
    );
  }
}

// POST /api/workspaces/:id/invites — create invite (RBAC: OWNER)
export async function POST(
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
    const workspaceId = Number(idStr);
    if (Number.isNaN(workspaceId)) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: '유효하지 않은 워크스페이스 ID입니다' } },
        { status: 400 },
      );
    }

    const userId = session.user.id as string;
    const check = await requireRole(userId, workspaceId, TEAM_ROLE.OWNER);
    if (isRoleError(check)) return check;

    const body = await request.json();
    const result = createInviteSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: result.error.errors[0]?.message ?? '입력 오류' } },
        { status: 400 },
      );
    }

    const { role } = result.data;

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24-hour expiry

    const invite = await createInvite({
      workspaceId,
      invitedBy: check.member.id,
      role,
      expiresAt,
    });

    const inviteUrl = `${process.env.NEXTAUTH_URL ?? 'http://localhost:3000'}/invite/${invite.token}`;

    return NextResponse.json({ invite, inviteUrl }, { status: 201 });
  } catch (error) {
    console.error('POST /api/workspaces/:id/invites error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 },
    );
  }
}
