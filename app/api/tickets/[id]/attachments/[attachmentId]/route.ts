import { NextRequest, NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import { auth } from '@/lib/auth';
import { getAttachmentById, deleteAttachment } from '@/db/queries/attachments';
import { requireRole, isRoleError } from '@/lib/permissions';
import { TEAM_ROLE } from '@/types/index';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' } },
        { status: 401 },
      );
    }

    const userId = session.user.id as string;
    const workspaceId = session.user.workspaceId as number | null;
    if (workspaceId) {
      const roleCheck = await requireRole(userId, workspaceId, TEAM_ROLE.MEMBER);
      if (isRoleError(roleCheck)) return roleCheck;
    }

    const { attachmentId } = await params;
    const id = Number(attachmentId);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: '유효하지 않은 첨부파일 ID입니다' } },
        { status: 400 },
      );
    }

    const attachment = await getAttachmentById(id);
    if (!attachment) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: '첨부파일을 찾을 수 없습니다' } },
        { status: 404 },
      );
    }

    // Delete from Vercel Blob storage then remove DB record
    await del(attachment.url);
    await deleteAttachment(id);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('DELETE /api/tickets/[id]/attachments/[attachmentId] error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 },
    );
  }
}
