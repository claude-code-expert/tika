import { NextResponse } from 'next/server';
import { getMemberByUserId } from '@/db/queries/members';
import { TEAM_ROLE, type TeamRole, type Member } from '@/types/index';

const ROLE_RANK: Record<TeamRole, number> = {
  [TEAM_ROLE.OWNER]: 3,
  [TEAM_ROLE.MEMBER]: 2,
  [TEAM_ROLE.VIEWER]: 1,
};

export type RoleCheckResult = { member: Member } | NextResponse;

/**
 * Verify that the given userId is a member of workspaceId with at least `minimum` role.
 * Returns `{ member }` on success, or a 403 NextResponse on failure.
 *
 * Usage:
 *   const check = await requireRole(userId, workspaceId, TEAM_ROLE.OWNER);
 *   if (isRoleError(check)) return check;
 *   const { member } = check;
 */
export async function requireRole(
  userId: string,
  workspaceId: number,
  minimum: TeamRole,
): Promise<RoleCheckResult> {
  const member = await getMemberByUserId(userId, workspaceId);

  if (!member) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: '워크스페이스 멤버가 아닙니다' } },
      { status: 403 },
    );
  }

  const memberRank = ROLE_RANK[member.role as TeamRole] ?? 0;
  const minimumRank = ROLE_RANK[minimum];

  if (memberRank < minimumRank) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: '권한이 부족합니다' } },
      { status: 403 },
    );
  }

  return { member };
}

export function isRoleError(result: RoleCheckResult): result is NextResponse {
  return result instanceof NextResponse;
}
