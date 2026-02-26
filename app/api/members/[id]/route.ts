import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { updateMember, updateMemberRole, removeMember, getAdminCount, getMembersWithEmailByWorkspace } from '@/db/queries/members';

const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, '올바른 HEX 색상 코드가 아닙니다')
    .optional(),
});

const updateRoleSchema = z.object({
  role: z.enum(['admin', 'member']),
});

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
        { error: { code: 'VALIDATION_ERROR', message: '유효하지 않은 멤버 ID입니다' } },
        { status: 400 },
      );
    }

    const workspaceId = (session.user as Record<string, unknown>).workspaceId as number;
    const body = await request.json();

    // Role update request (settings page)
    if ('role' in body) {
      const result = updateRoleSchema.safeParse(body);
      if (!result.success) {
        return NextResponse.json(
          { error: { code: 'VALIDATION_ERROR', message: result.error.errors[0]?.message ?? '입력 오류' } },
          { status: 400 },
        );
      }

      const { role } = result.data;
      if (role === 'member') {
        const allMembers = await getMembersWithEmailByWorkspace(workspaceId);
        const targetMember = allMembers.find((m) => m.id === id);
        if (targetMember?.role === 'admin') {
          const adminCount = await getAdminCount(workspaceId);
          if (adminCount <= 1) {
            return NextResponse.json(
              { error: { code: 'LAST_ADMIN', message: '워크스페이스에 관리자가 최소 1명이어야 합니다' } },
              { status: 409 },
            );
          }
        }
      }

      const updated = await updateMemberRole(id, workspaceId, role);
      if (!updated) {
        return NextResponse.json(
          { error: { code: 'NOT_FOUND', message: '멤버를 찾을 수 없습니다' } },
          { status: 404 },
        );
      }

      const allMembers2 = await getMembersWithEmailByWorkspace(workspaceId);
      const memberWithEmail = allMembers2.find((m) => m.id === id);
      return NextResponse.json({ member: memberWithEmail ?? updated });
    }

    // Profile update request (own profile only)
    const memberId = (session.user as Record<string, unknown>).memberId as number;
    if (memberId !== id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '본인의 프로필만 수정할 수 있습니다' } },
        { status: 403 },
      );
    }

    const result = updateProfileSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: result.error.errors[0].message } },
        { status: 400 },
      );
    }

    const member = await updateMember(id, workspaceId, result.data);
    if (!member) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: '멤버를 찾을 수 없습니다' } },
        { status: 404 },
      );
    }

    return NextResponse.json({ member });
  } catch (error) {
    console.error('PATCH /api/members/:id error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 },
    );
  }
}

export async function DELETE(
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
    const id = Number(idStr);
    if (Number.isNaN(id)) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: '유효하지 않은 멤버 ID입니다' } },
        { status: 400 },
      );
    }

    const workspaceId = (session.user as Record<string, unknown>).workspaceId as number;
    const allMembers = await getMembersWithEmailByWorkspace(workspaceId);
    const targetMember = allMembers.find((m) => m.id === id);

    if (!targetMember) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: '멤버를 찾을 수 없습니다' } },
        { status: 404 },
      );
    }

    if (targetMember.role === 'admin') {
      const adminCount = await getAdminCount(workspaceId);
      if (adminCount <= 1) {
        return NextResponse.json(
          { error: { code: 'LAST_ADMIN', message: '마지막 관리자는 제거할 수 없습니다' } },
          { status: 409 },
        );
      }
    }

    await removeMember(id, workspaceId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('DELETE /api/members/:id error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 },
    );
  }
}
