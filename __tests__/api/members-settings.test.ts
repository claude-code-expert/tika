/**
 * @jest-environment node
 *
 * 멤버 관리 설정 API 테스트
 * TC-MEMBER-CRUD: PATCH /api/members/[id] (역할 변경, 프로필 수정), DELETE /api/members/[id]
 */

jest.mock('@/lib/auth', () => ({ auth: jest.fn() }));
jest.mock('@/db/queries/members', () => ({
  updateMember: jest.fn(),
  updateMemberRole: jest.fn(),
  removeMember: jest.fn(),
  getAdminCount: jest.fn(),
  getMembersWithEmailByWorkspace: jest.fn(),
}));

import { NextRequest } from 'next/server';
import { PATCH, DELETE } from '@/app/api/members/[id]/route';
import { auth } from '@/lib/auth';
import {
  updateMember,
  updateMemberRole,
  removeMember,
  getAdminCount,
  getMembersWithEmailByWorkspace,
} from '@/db/queries/members';
import type { MemberWithEmail } from '@/types/index';

const mockedAuth = auth as jest.Mock;
const mockedUpdateMember = updateMember as jest.Mock;
const mockedUpdateMemberRole = updateMemberRole as jest.Mock;
const mockedRemoveMember = removeMember as jest.Mock;
const mockedGetAdminCount = getAdminCount as jest.Mock;
const mockedGetMembersWithEmail = getMembersWithEmailByWorkspace as jest.Mock;

const mockSession = { user: { id: 'user-1', workspaceId: 1, memberId: 1 } };

const mockMemberWithEmail: MemberWithEmail = {
  id: 1,
  userId: 'user-1',
  workspaceId: 1,
  displayName: '홍길동',
  color: '#629584',
  role: 'admin',
  createdAt: '2026-01-01T00:00:00.000Z',
  email: 'hong@example.com',
};

const mockMember2: MemberWithEmail = {
  id: 2,
  userId: 'user-2',
  workspaceId: 1,
  displayName: '김민수',
  color: '#60A5FA',
  role: 'member',
  createdAt: '2026-01-05T00:00:00.000Z',
  email: 'kim@example.com',
};

function makePatchRequest(id: string, body: unknown): [NextRequest, { params: Promise<{ id: string }> }] {
  const req = new NextRequest(`http://localhost/api/members/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return [req, { params: Promise.resolve({ id }) }];
}

function makeDeleteRequest(id: string): [NextRequest, { params: Promise<{ id: string }> }] {
  const req = new NextRequest(`http://localhost/api/members/${id}`, { method: 'DELETE' });
  return [req, { params: Promise.resolve({ id }) }];
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ─────────────────────────────────────────────
//  PATCH /api/members/[id] — 역할 변경
// ─────────────────────────────────────────────
describe('PATCH /api/members/[id] - 역할 변경', () => {
  it('미인증 요청은 401을 반환한다', async () => {
    mockedAuth.mockResolvedValueOnce(null);
    const [req, ctx] = makePatchRequest('2', { role: 'admin' });
    const res = await PATCH(req, ctx);
    const body = await res.json();
    expect(res.status).toBe(401);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('잘못된 id 형식은 400을 반환한다', async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);
    const [req, ctx] = makePatchRequest('abc', { role: 'admin' });
    const res = await PATCH(req, ctx);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('잘못된 role 값은 400을 반환한다', async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);
    const [req, ctx] = makePatchRequest('2', { role: 'superadmin' });
    const res = await PATCH(req, ctx);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('admin을 member로 변경 시 마지막 관리자면 409를 반환한다', async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);
    mockedGetMembersWithEmail.mockResolvedValueOnce([mockMemberWithEmail]);
    mockedGetAdminCount.mockResolvedValueOnce(1);
    const [req, ctx] = makePatchRequest('1', { role: 'member' });
    const res = await PATCH(req, ctx);
    const body = await res.json();
    expect(res.status).toBe(409);
    expect(body.error.code).toBe('LAST_ADMIN');
  });

  it('member를 admin으로 변경하면 200을 반환한다', async () => {
    const updatedMember = { ...mockMember2, role: 'admin' as const };
    mockedAuth.mockResolvedValueOnce(mockSession);
    mockedUpdateMemberRole.mockResolvedValueOnce(updatedMember);
    mockedGetMembersWithEmail.mockResolvedValueOnce([updatedMember]);
    const [req, ctx] = makePatchRequest('2', { role: 'admin' });
    const res = await PATCH(req, ctx);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.member.role).toBe('admin');
  });

  it('admin이 2명 이상일 때 member로 다운그레이드 가능하다', async () => {
    const updatedMember = { ...mockMemberWithEmail, role: 'member' as const };
    mockedAuth.mockResolvedValueOnce(mockSession);
    mockedGetMembersWithEmail.mockResolvedValueOnce([mockMemberWithEmail, mockMember2]);
    mockedGetAdminCount.mockResolvedValueOnce(2);
    mockedUpdateMemberRole.mockResolvedValueOnce(updatedMember);
    mockedGetMembersWithEmail.mockResolvedValueOnce([updatedMember, mockMember2]);
    const [req, ctx] = makePatchRequest('1', { role: 'member' });
    const res = await PATCH(req, ctx);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.member.role).toBe('member');
  });

  it('존재하지 않는 멤버 역할 변경은 404를 반환한다', async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);
    mockedUpdateMemberRole.mockResolvedValueOnce(null);
    const [req, ctx] = makePatchRequest('999', { role: 'admin' });
    const res = await PATCH(req, ctx);
    const body = await res.json();
    expect(res.status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
  });
});

// ─────────────────────────────────────────────
//  PATCH /api/members/[id] — 프로필 수정 (본인만)
// ─────────────────────────────────────────────
describe('PATCH /api/members/[id] - 프로필 수정', () => {
  it('다른 멤버 프로필 수정 시도는 403을 반환한다', async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);
    const [req, ctx] = makePatchRequest('2', { displayName: '새 이름' });
    const res = await PATCH(req, ctx);
    const body = await res.json();
    expect(res.status).toBe(403);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('본인 displayName 수정은 200을 반환한다', async () => {
    const updated = { ...mockMemberWithEmail, displayName: '홍길순' };
    mockedAuth.mockResolvedValueOnce(mockSession);
    mockedUpdateMember.mockResolvedValueOnce(updated);
    const [req, ctx] = makePatchRequest('1', { displayName: '홍길순' });
    const res = await PATCH(req, ctx);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.member.displayName).toBe('홍길순');
  });

  it('본인 color 수정은 200을 반환한다', async () => {
    const updated = { ...mockMemberWithEmail, color: '#fb2c36' };
    mockedAuth.mockResolvedValueOnce(mockSession);
    mockedUpdateMember.mockResolvedValueOnce(updated);
    const [req, ctx] = makePatchRequest('1', { color: '#fb2c36' });
    const res = await PATCH(req, ctx);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.member.color).toBe('#fb2c36');
  });

  it('잘못된 HEX 색상은 400을 반환한다', async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);
    const [req, ctx] = makePatchRequest('1', { color: 'red' });
    const res = await PATCH(req, ctx);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });
});

// ─────────────────────────────────────────────
//  DELETE /api/members/[id]
// ─────────────────────────────────────────────
describe('DELETE /api/members/[id]', () => {
  it('미인증 요청은 401을 반환한다', async () => {
    mockedAuth.mockResolvedValueOnce(null);
    const [req, ctx] = makeDeleteRequest('2');
    const res = await DELETE(req, ctx);
    const body = await res.json();
    expect(res.status).toBe(401);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('잘못된 id 형식은 400을 반환한다', async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);
    const [req, ctx] = makeDeleteRequest('abc');
    const res = await DELETE(req, ctx);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('존재하지 않는 멤버는 404를 반환한다', async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);
    mockedGetMembersWithEmail.mockResolvedValueOnce([]);
    const [req, ctx] = makeDeleteRequest('999');
    const res = await DELETE(req, ctx);
    const body = await res.json();
    expect(res.status).toBe(404);
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('마지막 관리자는 제거할 수 없다 (409)', async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);
    mockedGetMembersWithEmail.mockResolvedValueOnce([mockMemberWithEmail]);
    mockedGetAdminCount.mockResolvedValueOnce(1);
    const [req, ctx] = makeDeleteRequest('1');
    const res = await DELETE(req, ctx);
    const body = await res.json();
    expect(res.status).toBe(409);
    expect(body.error.code).toBe('LAST_ADMIN');
  });

  it('일반 멤버는 204로 성공적으로 제거된다', async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);
    mockedGetMembersWithEmail.mockResolvedValueOnce([mockMember2]);
    mockedRemoveMember.mockResolvedValueOnce(true);
    const [req, ctx] = makeDeleteRequest('2');
    const res = await DELETE(req, ctx);
    expect(res.status).toBe(204);
  });

  it('관리자가 2명 이상이면 관리자도 제거 가능하다', async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);
    mockedGetMembersWithEmail.mockResolvedValueOnce([mockMemberWithEmail, { ...mockMember2, role: 'admin' as const }]);
    mockedGetAdminCount.mockResolvedValueOnce(2);
    mockedRemoveMember.mockResolvedValueOnce(true);
    const [req, ctx] = makeDeleteRequest('1');
    const res = await DELETE(req, ctx);
    expect(res.status).toBe(204);
  });

  it('DB 오류 시 500을 반환한다', async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);
    mockedGetMembersWithEmail.mockRejectedValueOnce(new Error('DB error'));
    const [req, ctx] = makeDeleteRequest('2');
    const res = await DELETE(req, ctx);
    const body = await res.json();
    expect(res.status).toBe(500);
    expect(body.error.code).toBe('INTERNAL_ERROR');
  });
});
