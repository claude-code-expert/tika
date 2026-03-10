/**
 * @jest-environment node
 *
 * DELETE /api/workspaces/[id]/reset — workspace data reset tests
 */

jest.mock('@/lib/auth', () => ({ auth: jest.fn() }));
jest.mock('@/db/queries/workspaces', () => ({
  getWorkspaceById: jest.fn(),
  resetWorkspaceData: jest.fn(),
}));
jest.mock('@/db/queries/members', () => ({
  getMemberByUserId: jest.fn(),
}));

import { NextRequest } from 'next/server';
import { DELETE } from '@/app/api/workspaces/[id]/reset/route';
import { auth } from '@/lib/auth';
import { getWorkspaceById, resetWorkspaceData } from '@/db/queries/workspaces';
import { getMemberByUserId } from '@/db/queries/members';

const mockedAuth = auth as jest.Mock;
const mockedGetWorkspaceById = getWorkspaceById as jest.Mock;
const mockedResetWorkspaceData = resetWorkspaceData as jest.Mock;
const mockedGetMemberByUserId = getMemberByUserId as jest.Mock;

const mockSession = { user: { id: 'user-1', workspaceId: 1 } };
const mockWorkspace = { id: 1, name: '내 워크스페이스', description: null, ownerId: 'user-1', type: 'TEAM', iconColor: null, createdAt: '2026-01-01T00:00:00.000Z' };
const mockOwnerMember = { id: 1, userId: 'user-1', workspaceId: 1, displayName: '홍길동', color: '#629584', role: 'OWNER', invitedBy: null, joinedAt: null, createdAt: '2026-01-01T00:00:00.000Z' };
const mockMemberMember = { ...mockOwnerMember, id: 2, userId: 'user-2', role: 'MEMBER' };

function makeDeleteRequest(id: string, body: unknown): [NextRequest, { params: Promise<{ id: string }> }] {
  const req = new NextRequest(`http://localhost/api/workspaces/${id}/reset`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return [req, { params: Promise.resolve({ id }) }];
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('DELETE /api/workspaces/[id]/reset', () => {
  it('204 on valid reset when name matches', async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);
    mockedGetMemberByUserId.mockResolvedValueOnce(mockOwnerMember);
    mockedGetWorkspaceById.mockResolvedValueOnce(mockWorkspace);
    mockedResetWorkspaceData.mockResolvedValueOnce(undefined);

    const [req, ctx] = makeDeleteRequest('1', { confirmName: '내 워크스페이스' });
    const res = await DELETE(req, ctx);
    expect(res.status).toBe(204);
    expect(mockedResetWorkspaceData).toHaveBeenCalledWith(1);
  });

  it('400 when name does not match', async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);
    mockedGetMemberByUserId.mockResolvedValueOnce(mockOwnerMember);
    mockedGetWorkspaceById.mockResolvedValueOnce(mockWorkspace);

    const [req, ctx] = makeDeleteRequest('1', { confirmName: '틀린 이름' });
    const res = await DELETE(req, ctx);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.message).toBe('워크스페이스 이름이 일치하지 않습니다');
  });

  it('403 when non-OWNER tries to reset', async () => {
    mockedAuth.mockResolvedValueOnce({ user: { id: 'user-2', workspaceId: 1 } });
    mockedGetMemberByUserId.mockResolvedValueOnce(mockMemberMember);

    const [req, ctx] = makeDeleteRequest('1', { confirmName: '내 워크스페이스' });
    const res = await DELETE(req, ctx);
    const body = await res.json();
    expect(res.status).toBe(403);
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('401 when unauthenticated', async () => {
    mockedAuth.mockResolvedValueOnce(null);

    const [req, ctx] = makeDeleteRequest('1', { confirmName: '내 워크스페이스' });
    const res = await DELETE(req, ctx);
    const body = await res.json();
    expect(res.status).toBe(401);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });
});
