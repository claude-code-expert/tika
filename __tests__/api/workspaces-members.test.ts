/**
 * @jest-environment node
 *
 * 워크스페이스 멤버 관리 API 테스트
 *
 * TC-WS-MEMBER-RBAC:
 *   PATCH  /api/workspaces/[id]/members/[memberId] — 역할 변경 (OWNER RBAC)
 *   DELETE /api/workspaces/[id]/members/[memberId] — 멤버 제거 (OWNER RBAC)
 *   DELETE /api/workspaces/[id]/members/me         — 워크스페이스 탈퇴
 */

jest.mock('@/lib/auth', () => ({ auth: jest.fn() }));
jest.mock('@/lib/permissions', () => ({
  requireRole: jest.fn(),
  isRoleError: jest.fn(),
}));
jest.mock('@/db/queries/members', () => ({
  getMembersWithEmailByWorkspace: jest.fn(),
  updateMemberRole: jest.fn(),
  removeMember: jest.fn(),
  getOwnerCount: jest.fn(),
  getMemberByUserId: jest.fn(),
}));
jest.mock('@/db/queries/workspaces', () => ({
  getWorkspaceById: jest.fn().mockResolvedValue({ name: '테스트 워크스페이스' }),
}));
jest.mock('@/lib/notifications', () => ({
  sendInAppNotification: jest.fn().mockResolvedValue(undefined),
  buildRoleChangedMessage: jest.fn().mockReturnValue({ title: 't', message: 'm' }),
  buildMemberRemovedMessage: jest.fn().mockReturnValue({ title: 't', message: 'm' }),
}));

import { NextRequest } from 'next/server';
import {
  PATCH as patchMember,
  DELETE as deleteMember,
} from '@/app/api/workspaces/[id]/members/[memberId]/route';
import { DELETE as leaveWorkspace } from '@/app/api/workspaces/[id]/members/me/route';
import { auth } from '@/lib/auth';
import { requireRole, isRoleError } from '@/lib/permissions';
import {
  getMembersWithEmailByWorkspace,
  updateMemberRole,
  removeMember,
  getOwnerCount,
  getMemberByUserId,
} from '@/db/queries/members';
import type { MemberWithEmail, Member } from '@/types/index';

// ── 타입 단언 헬퍼 ────────────────────────────────────────────────────────

const mockedAuth           = auth as jest.Mock;
const mockedRequireRole    = requireRole as jest.Mock;
const mockedIsRoleError    = isRoleError as jest.Mock;
const mockedGetMembers     = getMembersWithEmailByWorkspace as jest.Mock;
const mockedUpdateRole     = updateMemberRole as jest.Mock;
const mockedRemoveMember   = removeMember as jest.Mock;
const mockedGetOwnerCount  = getOwnerCount as jest.Mock;
const mockedGetMemberByUserId = getMemberByUserId as jest.Mock;

// ── 픽스쳐 ────────────────────────────────────────────────────────────────

const mockSession = { user: { id: 'user-1' } };

const ownerMember: Member = {
  id: 1, userId: 'user-1', workspaceId: 2,
  displayName: '홍길동', color: '#629584', role: 'OWNER',
  invitedBy: null, joinedAt: null, createdAt: '2026-01-01T00:00:00.000Z',
};

const ownerMemberWithEmail: MemberWithEmail = { ...ownerMember, email: 'owner@example.com' };

const regularMember: MemberWithEmail = {
  id: 3, userId: 'user-3', workspaceId: 2,
  displayName: '김민수', color: '#60A5FA', role: 'MEMBER',
  invitedBy: null, joinedAt: null, createdAt: '2026-01-05T00:00:00.000Z',
  email: 'kim@example.com',
};

// requireRole 성공 기본값
function mockRoleSuccess(member: Member = ownerMember) {
  mockedRequireRole.mockResolvedValue({ member });
  mockedIsRoleError.mockReturnValue(false);
}

// ── 요청 팩토리 ──────────────────────────────────────────────────────────

function makePatchRequest(wsId: string, memberId: string, body: unknown) {
  const req = new NextRequest(`http://localhost/api/workspaces/${wsId}/members/${memberId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return [req, { params: Promise.resolve({ id: wsId, memberId }) }] as const;
}

function makeDeleteRequest(wsId: string, memberId: string) {
  const req = new NextRequest(`http://localhost/api/workspaces/${wsId}/members/${memberId}`, { method: 'DELETE' });
  return [req, { params: Promise.resolve({ id: wsId, memberId }) }] as const;
}

function makeLeaveRequest(wsId: string) {
  const req = new NextRequest(`http://localhost/api/workspaces/${wsId}/members/me`, { method: 'DELETE' });
  return [req, { params: Promise.resolve({ id: wsId }) }] as const;
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ════════════════════════════════════════════════════════════════════════════
// PATCH /api/workspaces/:id/members/:memberId — 역할 변경
// ════════════════════════════════════════════════════════════════════════════

describe('PATCH /api/workspaces/:id/members/:memberId — 역할 변경', () => {
  it('미인증 요청은 401을 반환한다', async () => {
    mockedAuth.mockResolvedValueOnce(null);
    const [req, ctx] = makePatchRequest('2', '3', { role: 'MEMBER' });
    const res = await patchMember(req, ctx);
    const body = await res.json();
    expect(res.status).toBe(401);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('workspaceId가 숫자가 아니면 400을 반환한다', async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);
    const [req, ctx] = makePatchRequest('abc', '3', { role: 'MEMBER' });
    const res = await patchMember(req, ctx);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('memberId가 숫자가 아니면 400을 반환한다', async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);
    const [req, ctx] = makePatchRequest('2', 'xyz', { role: 'MEMBER' });
    const res = await patchMember(req, ctx);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('OWNER 권한 없으면 requireRole이 반환한 403 응답을 그대로 반환한다', async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);
    const { NextResponse } = await import('next/server');
    const forbiddenRes = NextResponse.json({ error: { code: 'FORBIDDEN' } }, { status: 403 });
    mockedRequireRole.mockResolvedValueOnce(forbiddenRes);
    mockedIsRoleError.mockReturnValueOnce(true);
    const [req, ctx] = makePatchRequest('2', '3', { role: 'MEMBER' });
    const res = await patchMember(req, ctx);
    expect(res.status).toBe(403);
  });

  it('유효하지 않은 role 값은 400을 반환한다', async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);
    mockRoleSuccess();
    const [req, ctx] = makePatchRequest('2', '3', { role: 'GOD' });
    const res = await patchMember(req, ctx);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('마지막 OWNER를 강등하려 하면 409 LAST_OWNER를 반환한다', async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);
    mockRoleSuccess();
    mockedGetMembers.mockResolvedValueOnce([ownerMemberWithEmail]); // 첫 번째 호출: 현재 멤버 조회
    mockedGetOwnerCount.mockResolvedValueOnce(1);
    const [req, ctx] = makePatchRequest('2', '1', { role: 'MEMBER' });
    const res = await patchMember(req, ctx);
    const body = await res.json();
    expect(res.status).toBe(409);
    expect(body.error.code).toBe('LAST_OWNER');
  });

  it('OWNER가 2명 이상이면 OWNER → MEMBER 강등이 가능하다 (200)', async () => {
    const secondOwner: MemberWithEmail = { ...regularMember, id: 4, role: 'OWNER' };
    const updatedMember: MemberWithEmail = { ...ownerMemberWithEmail, role: 'MEMBER' };
    mockedAuth.mockResolvedValueOnce(mockSession);
    mockRoleSuccess();
    mockedGetMembers.mockResolvedValueOnce([ownerMemberWithEmail, secondOwner]); // 강등 체크용
    mockedGetOwnerCount.mockResolvedValueOnce(2);
    mockedGetMembers.mockResolvedValueOnce([ownerMemberWithEmail, secondOwner]); // oldRole 조회용
    mockedUpdateRole.mockResolvedValueOnce(updatedMember);
    const [req, ctx] = makePatchRequest('2', '1', { role: 'MEMBER' });
    const res = await patchMember(req, ctx);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.member.role).toBe('MEMBER');
  });

  it('MEMBER → OWNER 승격은 200을 반환한다', async () => {
    const promoted: MemberWithEmail = { ...regularMember, role: 'OWNER' };
    mockedAuth.mockResolvedValueOnce(mockSession);
    mockRoleSuccess();
    // role=OWNER 이므로 getMembersWithEmailByWorkspace 첫 번째 호출 없이 바로 oldRole 조회로 넘어감
    mockedGetMembers.mockResolvedValueOnce([regularMember]);
    mockedUpdateRole.mockResolvedValueOnce(promoted);
    const [req, ctx] = makePatchRequest('2', '3', { role: 'OWNER' });
    const res = await patchMember(req, ctx);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.member.role).toBe('OWNER');
  });

  it('존재하지 않는 멤버 역할 변경은 404를 반환한다', async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);
    mockRoleSuccess();
    mockedGetMembers.mockResolvedValueOnce([regularMember]); // oldRole 조회용
    mockedUpdateRole.mockResolvedValueOnce(null);
    const [req, ctx] = makePatchRequest('2', '999', { role: 'OWNER' });
    const res = await patchMember(req, ctx);
    const body = await res.json();
    expect(res.status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('DB 오류 시 500을 반환한다', async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);
    mockRoleSuccess();
    mockedGetMembers.mockRejectedValueOnce(new Error('DB error'));
    const [req, ctx] = makePatchRequest('2', '3', { role: 'OWNER' });
    const res = await patchMember(req, ctx);
    const body = await res.json();
    expect(res.status).toBe(500);
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// DELETE /api/workspaces/:id/members/:memberId — 멤버 제거
// ════════════════════════════════════════════════════════════════════════════

describe('DELETE /api/workspaces/:id/members/:memberId — 멤버 제거', () => {
  it('미인증 요청은 401을 반환한다', async () => {
    mockedAuth.mockResolvedValueOnce(null);
    const [req, ctx] = makeDeleteRequest('2', '3');
    const res = await deleteMember(req, ctx);
    const body = await res.json();
    expect(res.status).toBe(401);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('workspaceId 또는 memberId가 숫자가 아니면 400을 반환한다', async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);
    const [req, ctx] = makeDeleteRequest('abc', '3');
    const res = await deleteMember(req, ctx);
    expect(res.status).toBe(400);
  });

  it('OWNER 권한 없으면 403을 반환한다', async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);
    const { NextResponse } = await import('next/server');
    const forbiddenRes = NextResponse.json({ error: { code: 'FORBIDDEN' } }, { status: 403 });
    mockedRequireRole.mockResolvedValueOnce(forbiddenRes);
    mockedIsRoleError.mockReturnValueOnce(true);
    const [req, ctx] = makeDeleteRequest('2', '3');
    const res = await deleteMember(req, ctx);
    expect(res.status).toBe(403);
  });

  it('자기 자신을 제거하려 하면 400 CANNOT_REMOVE_SELF를 반환한다', async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);
    // check.member.id === memberId → 자기 자신
    mockRoleSuccess(ownerMember); // ownerMember.id = 1
    const [req, ctx] = makeDeleteRequest('2', '1'); // memberId = 1 (자신)
    const res = await deleteMember(req, ctx);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error.code).toBe('CANNOT_REMOVE_SELF');
  });

  it('존재하지 않는 멤버는 404를 반환한다', async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);
    mockRoleSuccess();
    mockedGetMembers.mockResolvedValueOnce([]); // 멤버 없음
    const [req, ctx] = makeDeleteRequest('2', '999');
    const res = await deleteMember(req, ctx);
    const body = await res.json();
    expect(res.status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('마지막 OWNER는 제거할 수 없다 (409)', async () => {
    // 현재 사용자(ownerMember.id=1)가 아닌 다른 OWNER(id=5)를 제거 시도
    const otherOwner: MemberWithEmail = { ...ownerMemberWithEmail, id: 5, userId: 'user-5' };
    mockedAuth.mockResolvedValueOnce(mockSession);
    mockRoleSuccess(ownerMember);
    mockedGetMembers.mockResolvedValueOnce([otherOwner]);
    mockedGetOwnerCount.mockResolvedValueOnce(1);
    const [req, ctx] = makeDeleteRequest('2', '5');
    const res = await deleteMember(req, ctx);
    const body = await res.json();
    expect(res.status).toBe(409);
    expect(body.error.code).toBe('LAST_OWNER');
  });

  it('일반 멤버는 204로 성공적으로 제거된다', async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);
    mockRoleSuccess();
    mockedGetMembers.mockResolvedValueOnce([regularMember]);
    mockedRemoveMember.mockResolvedValueOnce(true);
    const [req, ctx] = makeDeleteRequest('2', '3');
    const res = await deleteMember(req, ctx);
    expect(res.status).toBe(204);
  });

  it('OWNER가 2명 이상이면 OWNER도 제거 가능하다 (204)', async () => {
    const secondOwner: MemberWithEmail = { ...ownerMemberWithEmail, id: 5, userId: 'user-5' };
    mockedAuth.mockResolvedValueOnce(mockSession);
    mockRoleSuccess();
    mockedGetMembers.mockResolvedValueOnce([secondOwner]);
    mockedGetOwnerCount.mockResolvedValueOnce(2);
    mockedRemoveMember.mockResolvedValueOnce(true);
    const [req, ctx] = makeDeleteRequest('2', '5');
    const res = await deleteMember(req, ctx);
    expect(res.status).toBe(204);
  });

  it('DB 오류 시 500을 반환한다', async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);
    mockRoleSuccess();
    mockedGetMembers.mockRejectedValueOnce(new Error('DB error'));
    const [req, ctx] = makeDeleteRequest('2', '3');
    const res = await deleteMember(req, ctx);
    const body = await res.json();
    expect(res.status).toBe(500);
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });
});

// ════════════════════════════════════════════════════════════════════════════
// DELETE /api/workspaces/:id/members/me — 워크스페이스 탈퇴
// ════════════════════════════════════════════════════════════════════════════

describe('DELETE /api/workspaces/:id/members/me — 탈퇴', () => {
  it('미인증 요청은 401을 반환한다', async () => {
    mockedAuth.mockResolvedValueOnce(null);
    const [req, ctx] = makeLeaveRequest('2');
    const res = await leaveWorkspace(req, ctx);
    const body = await res.json();
    expect(res.status).toBe(401);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('workspaceId가 숫자가 아니면 400을 반환한다', async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);
    const [req, ctx] = makeLeaveRequest('invalid');
    const res = await leaveWorkspace(req, ctx);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('워크스페이스 멤버가 아니면 404를 반환한다', async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);
    mockedGetMemberByUserId.mockResolvedValueOnce(null);
    const [req, ctx] = makeLeaveRequest('2');
    const res = await leaveWorkspace(req, ctx);
    const body = await res.json();
    expect(res.status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('OWNER는 탈퇴할 수 없다 (400 OWNER_CANNOT_LEAVE)', async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);
    mockedGetMemberByUserId.mockResolvedValueOnce(ownerMember); // role: OWNER
    const [req, ctx] = makeLeaveRequest('2');
    const res = await leaveWorkspace(req, ctx);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error.code).toBe('OWNER_CANNOT_LEAVE');
  });

  it('MEMBER는 204로 탈퇴할 수 있다', async () => {
    const memberMember: Member = { ...ownerMember, id: 3, userId: 'user-3', role: 'MEMBER' };
    mockedAuth.mockResolvedValueOnce(mockSession);
    mockedGetMemberByUserId.mockResolvedValueOnce(memberMember);
    mockedRemoveMember.mockResolvedValueOnce(true);
    const [req, ctx] = makeLeaveRequest('2');
    const res = await leaveWorkspace(req, ctx);
    expect(res.status).toBe(204);
  });

  it('VIEWER는 204로 탈퇴할 수 있다', async () => {
    const viewerMember: Member = { ...ownerMember, id: 4, userId: 'user-4', role: 'VIEWER' };
    mockedAuth.mockResolvedValueOnce(mockSession);
    mockedGetMemberByUserId.mockResolvedValueOnce(viewerMember);
    mockedRemoveMember.mockResolvedValueOnce(true);
    const [req, ctx] = makeLeaveRequest('2');
    const res = await leaveWorkspace(req, ctx);
    expect(res.status).toBe(204);
  });

  it('DB 오류 시 500을 반환한다', async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);
    mockedGetMemberByUserId.mockRejectedValueOnce(new Error('DB error'));
    const [req, ctx] = makeLeaveRequest('2');
    const res = await leaveWorkspace(req, ctx);
    const body = await res.json();
    expect(res.status).toBe(500);
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });
});
