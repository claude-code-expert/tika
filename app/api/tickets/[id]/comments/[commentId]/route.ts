import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { updateComment, deleteComment } from '@/db/queries/comments';
import { z } from 'zod';

const updateCommentSchema = z.object({
  text: z
    .string()
    .min(1, '댓글을 입력해주세요')
    .max(500, '댓글은 500자 이내로 입력해주세요'),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' } },
        { status: 401 },
      );
    }

    const { commentId } = await params;
    const id = Number(commentId);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: '유효하지 않은 댓글 ID입니다' } },
        { status: 400 },
      );
    }

    const body = await request.json();
    const parsed = updateCommentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0]?.message ?? '입력값이 올바르지 않습니다' } },
        { status: 400 },
      );
    }

    const memberId = (session.user as Record<string, unknown>).memberId as number | undefined;
    if (!memberId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '멤버 정보가 없습니다' } },
        { status: 401 },
      );
    }

    const updated = await updateComment(id, memberId, parsed.data.text);
    if (!updated) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: '댓글을 찾을 수 없거나 수정 권한이 없습니다' } },
        { status: 404 },
      );
    }

    return NextResponse.json({ comment: updated });
  } catch (error) {
    console.error('PATCH /api/tickets/[id]/comments/[commentId] error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' } },
        { status: 401 },
      );
    }

    const { commentId } = await params;
    const id = Number(commentId);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: '유효하지 않은 댓글 ID입니다' } },
        { status: 400 },
      );
    }

    const memberId = (session.user as Record<string, unknown>).memberId as number | undefined;
    if (!memberId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '멤버 정보가 없습니다' } },
        { status: 401 },
      );
    }

    const deleted = await deleteComment(id, memberId);
    if (!deleted) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: '댓글을 찾을 수 없거나 삭제 권한이 없습니다' } },
        { status: 404 },
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('DELETE /api/tickets/[id]/comments/[commentId] error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 },
    );
  }
}
