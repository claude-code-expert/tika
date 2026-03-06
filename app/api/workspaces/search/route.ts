import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db/index';
import { workspaces, members } from '@/db/schema';
import { eq, and, ilike, sql } from 'drizzle-orm';
import { workspaceSearchSchema } from '@/lib/validations';

// GET /api/workspaces/search?q=... — search public (is_searchable=true) TEAM workspaces
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다.' } },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') ?? '';

    const result = workspaceSearchSchema.safeParse({ q });
    if (!result.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: result.error.issues[0].message } },
        { status: 400 },
      );
    }

    const rows = await db
      .select({
        id: workspaces.id,
        name: workspaces.name,
        description: workspaces.description,
        memberCount: sql<number>`cast(count(${members.id}) as int)`,
      })
      .from(workspaces)
      .leftJoin(members, eq(members.workspaceId, workspaces.id))
      .where(
        and(
          eq(workspaces.isSearchable, true),
          eq(workspaces.type, 'TEAM'),
          ilike(workspaces.name, `%${result.data.q}%`),
        ),
      )
      .groupBy(workspaces.id)
      .limit(20);

    return NextResponse.json({ workspaces: rows });
  } catch (err) {
    console.error('GET /api/workspaces/search error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.' } },
      { status: 500 },
    );
  }
}
