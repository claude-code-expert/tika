import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { auth } from '@/lib/auth';
import { createAttachment, getAttachmentsByTicketId } from '@/db/queries/attachments';
import { requireRole, isRoleError } from '@/lib/permissions';
import { TEAM_ROLE } from '@/types/index';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

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

    const { id } = await params;
    const ticketId = Number(id);
    if (isNaN(ticketId)) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: '유효하지 않은 티켓 ID입니다' } },
        { status: 400 },
      );
    }

    const list = await getAttachmentsByTicketId(ticketId);
    return NextResponse.json({ attachments: list });
  } catch (error) {
    console.error('GET /api/tickets/[id]/attachments error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 },
    );
  }
}

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

    const { id } = await params;
    const ticketId = Number(id);
    if (isNaN(ticketId)) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: '유효하지 않은 티켓 ID입니다' } },
        { status: 400 },
      );
    }

    const userId = session.user.id as string;
    const workspaceId = session.user.workspaceId as number | null;
    if (workspaceId) {
      const roleCheck = await requireRole(userId, workspaceId, TEAM_ROLE.MEMBER);
      if (isRoleError(roleCheck)) return roleCheck;
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: '파일이 없습니다' } },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: '파일 크기는 10MB 이하여야 합니다' } },
        { status: 400 },
      );
    }

    const blob = await put(file.name, file, { access: 'public' });
    const memberId = (session.user.memberId as number | null) ?? null;
    const attachment = await createAttachment({
      ticketId,
      url: blob.url,
      name: file.name,
      size: file.size,
      mimeType: file.type || null,
      uploadedBy: memberId,
    });

    return NextResponse.json({ attachment }, { status: 201 });
  } catch (error) {
    console.error('POST /api/tickets/[id]/attachments error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 },
    );
  }
}
