import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getInvitesByWorkspace,
  createInvite,
  getPendingInviteByEmail,
} from '@/db/queries/invites';
import { getMemberByUserId, getMembersWithEmailByWorkspace } from '@/db/queries/members';
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

    const userId = (session.user as Record<string, unknown>).id as string;
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

    const userId = (session.user as Record<string, unknown>).id as string;
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

    const { email, role } = result.data;

    // Check for existing pending invite for this email
    const existing = await getPendingInviteByEmail(workspaceId, email);
    if (existing) {
      return NextResponse.json(
        { error: { code: 'PENDING_INVITE_EXISTS', message: '이미 해당 이메일로 대기 중인 초대가 있습니다' } },
        { status: 409 },
      );
    }

    // Check if email is already a member
    const allMembers = await getMembersWithEmailByWorkspace(workspaceId);
    const alreadyMember = allMembers.some((m) => m.email === email);
    if (alreadyMember) {
      return NextResponse.json(
        { error: { code: 'ALREADY_MEMBER', message: '이미 워크스페이스 멤버입니다' } },
        { status: 409 },
      );
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7-day expiry

    const invite = await createInvite({
      workspaceId,
      invitedBy: check.member.id,
      email,
      role,
      expiresAt,
    });

    const inviteUrl = `/invite/${invite.token}`;
    return NextResponse.json({ invite, inviteUrl }, { status: 201 });
  } catch (error) {
    console.error('POST /api/workspaces/:id/invites error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 },
    );
  }
}
