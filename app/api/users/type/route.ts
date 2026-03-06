import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db/index';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { patchUserTypeSchema } from '@/lib/validations';
import { createPersonalWorkspace } from '@/lib/auth';

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다.' } },
        { status: 401 },
      );
    }

    const body = await request.json();
    const result = patchUserTypeSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: result.error.issues[0].message } },
        { status: 400 },
      );
    }

    const { userType } = result.data;
    const userId = session.user.id;

    // Update users.user_type
    await db.update(users).set({ userType }).where(eq(users.id, userId));

    // For personal users: create workspace if none exists
    let workspace: { id: number } | null = null;
    if (userType === 'USER') {
      const { workspaces } = await import('@/db/schema');
      const existing = await db
        .select({ id: workspaces.id })
        .from(workspaces)
        .where(eq(workspaces.ownerId, userId))
        .limit(1);

      if (existing.length === 0) {
        const user = session.user;
        const name = user.name ?? '사용자';
        workspace = await createPersonalWorkspace(userId, name);
      } else {
        workspace = existing[0];
      }
    }

    return NextResponse.json(
      {
        user: { id: userId, userType },
        workspace: workspace ? { id: workspace.id } : null,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error('PATCH /api/users/type error:', err);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.' } },
      { status: 500 },
    );
  }
}
