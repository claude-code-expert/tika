import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db/index';
import { members } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getInAppMemberAlertCount } from '@/db/queries/inAppNotifications';

// GET /api/notifications/in-app/member-alert-count
// Returns unread count of member-related notifications — OWNER only (others get 0)
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ count: 0 });

    const workspaceId = (session.user as unknown as Record<string, unknown>).workspaceId as number | null;
    if (!workspaceId) return NextResponse.json({ count: 0 });

    const [ownerMember] = await db
      .select({ id: members.id })
      .from(members)
      .where(and(
        eq(members.userId, session.user.id),
        eq(members.workspaceId, workspaceId),
        eq(members.role, 'OWNER'),
      ))
      .limit(1);

    if (!ownerMember) return NextResponse.json({ count: 0 });

    const count = await getInAppMemberAlertCount(session.user.id);
    return NextResponse.json({ count });
  } catch (err) {
    console.error('GET /api/notifications/in-app/member-alert-count error:', err);
    return NextResponse.json({ count: 0 });
  }
}
