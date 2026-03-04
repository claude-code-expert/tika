import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getMembersWithEmailByWorkspace,
  updateMemberRole,
  removeMember,
  getOwnerCount,
} from '@/db/queries/members';
import { requireRole, isRoleError } from '@/lib/permissions';
import { updateMemberRoleSchema } from '@/lib/validations';
import { TEAM_ROLE } from '@/types/index';

// PATCH /api/workspaces/:id/members/:memberId — update member role (RBAC: OWNER)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' } },
        { status: 401 },
      );
    }

    const { id: idStr, memberId: memberIdStr } = await params;
    const workspaceId = Number(idStr);
    const memberId = Number(memberIdStr);
    if (Number.isNaN(workspaceId) || Number.isNaN(memberId)) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: '유효하지 않은 ID입니다' } },
        { status: 400 },
      );
    }

    const userId = (session.user as Record<string, unknown>).id as string;
    const check = await requireRole(userId, workspaceId, TEAM_ROLE.OWNER);
    if (isRoleError(check)) return check;

    const body = await request.json();
    const result = updateMemberRoleSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: result.error.errors[0]?.message ?? '입력 오류' } },
        { status: 400 },
      );
    }

    const { role } = result.data;

    // Prevent demoting the last OWNER
    if (role !== TEAM_ROLE.OWNER) {
      const allMembers = await getMembersWithEmailByWorkspace(workspaceId);
      const targetMember = allMembers.find((m) => m.id === memberId);
      if (targetMember?.role === TEAM_ROLE.OWNER) {
        const ownerCount = await getOwnerCount(workspaceId);
        if (ownerCount <= 1) {
          return NextResponse.json(
            { error: { code: 'LAST_OWNER', message: '마지막 OWNER의 역할은 변경할 수 없습니다' } },
            { status: 409 },
          );
        }
      }
    }

    const updated = await updateMemberRole(memberId, workspaceId, role);
    if (!updated) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: '멤버를 찾을 수 없습니다' } },
        { status: 404 },
      );
    }

    return NextResponse.json({ member: updated });
  } catch (error) {
    console.error('PATCH /api/workspaces/:id/members/:memberId error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 },
    );
  }
}

// DELETE /api/workspaces/:id/members/:memberId — remove member (RBAC: OWNER)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' } },
        { status: 401 },
      );
    }

    const { id: idStr, memberId: memberIdStr } = await params;
    const workspaceId = Number(idStr);
    const memberId = Number(memberIdStr);
    if (Number.isNaN(workspaceId) || Number.isNaN(memberId)) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: '유효하지 않은 ID입니다' } },
        { status: 400 },
      );
    }

    const userId = (session.user as Record<string, unknown>).id as string;
    const check = await requireRole(userId, workspaceId, TEAM_ROLE.OWNER);
    if (isRoleError(check)) return check;

    // Prevent removing self
    if (check.member.id === memberId) {
      return NextResponse.json(
        { error: { code: 'CANNOT_REMOVE_SELF', message: '자기 자신은 제거할 수 없습니다. 워크스페이스 탈퇴는 /me 엔드포인트를 사용하세요' } },
        { status: 400 },
      );
    }

    const allMembers = await getMembersWithEmailByWorkspace(workspaceId);
    const targetMember = allMembers.find((m) => m.id === memberId);
    if (!targetMember) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: '멤버를 찾을 수 없습니다' } },
        { status: 404 },
      );
    }

    // Prevent removing last OWNER
    if (targetMember.role === TEAM_ROLE.OWNER) {
      const ownerCount = await getOwnerCount(workspaceId);
      if (ownerCount <= 1) {
        return NextResponse.json(
          { error: { code: 'LAST_OWNER', message: '마지막 OWNER는 제거할 수 없습니다' } },
          { status: 409 },
        );
      }
    }

    await removeMember(memberId, workspaceId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('DELETE /api/workspaces/:id/members/:memberId error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 },
    );
  }
}
