/**
 * @jest-environment node
 *
 * POST /api/workspaces/[id]/transfer — ownership transfer tests
 */

jest.mock('@/lib/auth', () => ({ auth: jest.fn() }));
jest.mock('@/db/queries/members', () => ({
  getMemberByUserId: jest.fn(),
  transferOwnership: jest.fn(),
}));

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/workspaces/[id]/transfer/route';
import { auth } from '@/lib/auth';
import { getMemberByUserId, transferOwnership } from '@/db/queries/members';

const mockedAuth = auth as jest.Mock;
const mockedGetMemberByUserId = getMemberByUserId as jest.Mock;
const mockedTransferOwnership = transferOwnership as jest.Mock;

const mockSession = { user: { id: 'user-1', workspaceId: 1 } };
const mockOwnerMember = { id: 1, userId: 'user-1', workspaceId: 1, displayName: '홍길동', color: '#629584', role: 'OWNER', invitedBy: null, joinedAt: null, createdAt: '2026-01-01T00:00:00.000Z' };
const mockMemberMember = { ...mockOwnerMember, id: 2, userId: 'user-2', role: 'MEMBER' };

function makePostRequest(id: string, body: unknown): [NextRequest, { params: Promise<{ id: string }> }] {
  const req = new NextRequest(`http://localhost/api/workspaces/${id}/transfer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return [req, { params: Promise.resolve({ id }) }];
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('POST /api/workspaces/[id]/transfer', () => {
  it('200 on valid transfer (OWNER transfers to MEMBER)', async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);
    mockedGetMemberByUserId.mockResolvedValueOnce(mockOwnerMember);
    mockedTransferOwnership.mockResolvedValueOnce(undefined);

    const [req, ctx] = makePostRequest('1', { targetMemberId: 2 });
    const res = await POST(req, ctx);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockedTransferOwnership).toHaveBeenCalledWith(1, 'user-1', 2);
  });

  it('403 when non-OWNER tries to transfer', async () => {
    mockedAuth.mockResolvedValueOnce({ user: { id: 'user-2', workspaceId: 1 } });
    mockedGetMemberByUserId.mockResolvedValueOnce(mockMemberMember);

    const [req, ctx] = makePostRequest('1', { targetMemberId: 3 });
    const res = await POST(req, ctx);
    const body = await res.json();
    expect(res.status).toBe(403);
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('400 on invalid body (missing targetMemberId)', async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);
    mockedGetMemberByUserId.mockResolvedValueOnce(mockOwnerMember);

    const [req, ctx] = makePostRequest('1', {});
    const res = await POST(req, ctx);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('500 when target not in workspace (transferOwnership throws)', async () => {
    mockedAuth.mockResolvedValueOnce(mockSession);
    mockedGetMemberByUserId.mockResolvedValueOnce(mockOwnerMember);
    mockedTransferOwnership.mockRejectedValueOnce(new Error('Target member not found'));

    const [req, ctx] = makePostRequest('1', { targetMemberId: 999 });
    const res = await POST(req, ctx);
    const body = await res.json();
    expect(res.status).toBe(500);
    expect(body.error.message).toBe('Target member not found');
  });

  it('401 when unauthenticated', async () => {
    mockedAuth.mockResolvedValueOnce(null);

    const [req, ctx] = makePostRequest('1', { targetMemberId: 2 });
    const res = await POST(req, ctx);
    const body = await res.json();
    expect(res.status).toBe(401);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });
});
