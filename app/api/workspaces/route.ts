import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db/index';
import { workspaces } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' } },
        { status: 401 },
      );
    }

    const userId = (session.user as Record<string, unknown>).id as string;

    const rows = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.ownerId, userId));

    return NextResponse.json({
      workspaces: rows.map((w) => ({
        id: w.id,
        name: w.name,
        ownerId: w.ownerId,
        createdAt: w.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('GET /api/workspaces error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다' } },
      { status: 500 },
    );
  }
}
