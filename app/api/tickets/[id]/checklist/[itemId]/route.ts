import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { updateChecklistItemSchema } from '@/lib/validations';
import { updateChecklistItem, deleteChecklistItem } from '@/db/queries/checklist';

type RouteContext = { params: Promise<{ id: string; itemId: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' } },
        { status: 401 },
      );
    }

    const { itemId } = await context.params;
    const id = Number(itemId);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: '유효하지 않은 항목 ID입니다' } },
        { status: 400 },
      );
    }

    const body = await request.json();
    const result = updateChecklistItemSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: result.error.errors[0].message } },
        { status: 400 },
      );
    }

    const item = await updateChecklistItem(id, result.data);
    if (!item) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: '항목을 찾을 수 없습니다' } },
        { status: 404 },
      );
    }
    return NextResponse.json({ item });
  } catch (error) {
    console.error('PATCH /api/tickets/:id/checklist/:itemId error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 내부 오류가 발생했습니다' } },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' } },
        { status: 401 },
      );
    }

    const { itemId } = await context.params;
    const id = Number(itemId);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: '유효하지 않은 항목 ID입니다' } },
        { status: 400 },
      );
    }

    await deleteChecklistItem(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('DELETE /api/tickets/:id/checklist/:itemId error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 내부 오류가 발생했습니다' } },
      { status: 500 },
    );
  }
}
