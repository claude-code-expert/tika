import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { auth } from '@/lib/auth';
import { createLabelSchema } from '@/lib/validations';
import { getLabelsByWorkspaceWithCount, createLabel } from '@/db/queries/labels';

function getWorkspaceId(session: Session | null): number | null {
  return ((session?.user as Record<string, unknown> | undefined)?.workspaceId as number) ?? null;
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' } },
        { status: 401 },
      );
    }
    const workspaceId = getWorkspaceId(session);
    if (!workspaceId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '워크스페이스를 찾을 수 없습니다' } },
        { status: 401 },
      );
    }
    const labelList = await getLabelsByWorkspaceWithCount(workspaceId);
    return NextResponse.json({ labels: labelList });
  } catch (error) {
    console.error('GET /api/labels error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 내부 오류가 발생했습니다' } },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' } },
        { status: 401 },
      );
    }
    const workspaceId = getWorkspaceId(session);
    if (!workspaceId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '워크스페이스를 찾을 수 없습니다' } },
        { status: 401 },
      );
    }

    const body = await request.json();
    const result = createLabelSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: result.error.errors[0].message } },
        { status: 400 },
      );
    }

    const label = await createLabel(workspaceId, result.data);
    if ('error' in label) {
      if (label.error === 'LIMIT_EXCEEDED') {
        return NextResponse.json(
          { error: { code: 'LABEL_LIMIT_EXCEEDED', message: '라벨은 최대 20개까지 생성할 수 있습니다' } },
          { status: 400 },
        );
      }
      return NextResponse.json(
        { error: { code: 'LABEL_NAME_DUPLICATE', message: '이미 존재하는 라벨명입니다' } },
        { status: 409 },
      );
    }

    return NextResponse.json({ label }, { status: 201 });
  } catch (error) {
    console.error('POST /api/labels error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 내부 오류가 발생했습니다' } },
      { status: 500 },
    );
  }
}
