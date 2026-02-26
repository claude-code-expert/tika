import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getCommentsByTicketId, createComment } from '@/db/queries/comments';
import { z } from 'zod';

const createCommentSchema = z.object({
  text: z
    .string()
    .min(1, '댓글을 입력해주세요')
    .max(500, '댓글은 500자 이내로 입력해주세요'),
});

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

    const commentList = await getCommentsByTicketId(ticketId);
    return NextResponse.json({ comments: commentList });
  } catch (error) {
    console.error('GET /api/tickets/[id]/comments error:', error);
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

    const body = await request.json();
    const parsed = createCommentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0]?.message ?? '입력값이 올바르지 않습니다' } },
        { status: 400 },
      );
    }

    const memberId = (session.user as Record<string, unknown>).memberId as number | null ?? null;
    const comment = await createComment(ticketId, memberId, parsed.data.text);
    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error('POST /api/tickets/[id]/comments error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 },
    );
  }
}
