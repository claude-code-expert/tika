import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { withdrawAccountSchema } from '@/lib/validations';
import { getSoleOwnerWorkspaces, withdrawUser } from '@/db/queries/users';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다.' } },
        { status: 401 },
      );
    }

    const body = await request.json();
    const result = withdrawAccountSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: result.error.errors[0]?.message ?? '입력값이 올바르지 않습니다.' } },
        { status: 400 },
      );
    }

    // Verify email matches
    if (result.data.confirmEmail !== session.user.email) {
      return NextResponse.json(
        { error: { code: 'EMAIL_MISMATCH', message: '입력한 이메일이 현재 계정과 일치하지 않습니다.' } },
        { status: 400 },
      );
    }

    // Check sole OWNER workspaces
    const soleOwnerWorkspaces = await getSoleOwnerWorkspaces(session.user.id as string);
    if (soleOwnerWorkspaces.length > 0) {
      return NextResponse.json(
        {
          error: {
            code: 'SOLE_OWNER',
            message: '소유한 워크스페이스의 소유권을 이전하거나 삭제한 후 탈퇴해주세요.',
            workspaces: soleOwnerWorkspaces,
          },
        },
        { status: 409 },
      );
    }

    // Perform withdrawal
    await withdrawUser(session.user.id as string);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Account withdrawal error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '탈퇴 처리 중 오류가 발생했습니다.' } },
      { status: 500 },
    );
  }
}
