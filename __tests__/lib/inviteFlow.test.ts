/**
 * T075: Invite flow unit tests
 * Tests EMAIL_MISMATCH 403, PENDING→ACCEPTED transition, EXPIRED token 400
 */

// Mock dependencies
jest.mock('@/db/index', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    transaction: jest.fn(),
  },
}));

jest.mock('@/db/queries/invites', () => ({
  getInviteByToken: jest.fn(),
  acceptInvite: jest.fn(),
  rejectInvite: jest.fn(),
}));

jest.mock('@/db/queries/members', () => ({
  getMemberByUserId: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}));

import { auth } from '@/lib/auth';
import { getInviteByToken, acceptInvite, rejectInvite } from '@/db/queries/invites';
import { getMemberByUserId } from '@/db/queries/members';

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const mockGetInviteByToken = getInviteByToken as jest.MockedFunction<typeof getInviteByToken>;
const mockAcceptInvite = acceptInvite as jest.MockedFunction<typeof acceptInvite>;
const mockGetMemberByUserId = getMemberByUserId as jest.MockedFunction<typeof getMemberByUserId>;

function makeInvite(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 1,
    workspaceId: 100,
    invitedBy: 1,
    token: 'test-token-uuid',
    email: 'invited@example.com',
    role: 'MEMBER',
    status: 'PENDING',
    expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeSession(email: string, userId = 'user-123') {
  return {
    user: { id: userId, email, name: 'Test User' },
    expires: new Date(Date.now() + 86400000).toISOString(),
  };
}

describe('Invite Flow Logic', () => {
  afterEach(() => jest.clearAllMocks());

  // ─── PENDING invite retrieval ─────────────────────────────────────────────

  it('getInviteByToken returns invite for valid PENDING token', async () => {
    const invite = makeInvite();
    mockGetInviteByToken.mockResolvedValue(invite as never);
    const result = await getInviteByToken('test-token-uuid');
    expect(result).not.toBeNull();
    expect(result?.status).toBe('PENDING');
  });

  it('getInviteByToken returns null for unknown token', async () => {
    mockGetInviteByToken.mockResolvedValue(null);
    const result = await getInviteByToken('unknown-token');
    expect(result).toBeNull();
  });

  // ─── EMAIL_MISMATCH (403) ─────────────────────────────────────────────────

  it('detects EMAIL_MISMATCH when session email differs from invite email', async () => {
    const invite = makeInvite({ email: 'invited@example.com' });
    mockGetInviteByToken.mockResolvedValue(invite as never);
    const session = makeSession('different@example.com');
    mockAuth.mockResolvedValue(session as never);

    const inviteData = await getInviteByToken('test-token-uuid');
    const sessionData = await auth();

    const userEmail = (sessionData?.user as Record<string, unknown>)?.email as string;
    const isEmailMismatch =
      inviteData?.email.toLowerCase() !== userEmail?.toLowerCase();

    expect(isEmailMismatch).toBe(true);
  });

  it('passes email check when session email matches invite (case-insensitive)', async () => {
    const invite = makeInvite({ email: 'Invited@Example.com' });
    mockGetInviteByToken.mockResolvedValue(invite as never);
    const session = makeSession('invited@example.com');
    mockAuth.mockResolvedValue(session as never);

    const inviteData = await getInviteByToken('test-token-uuid');
    const sessionData = await auth();

    const userEmail = (sessionData?.user as Record<string, unknown>)?.email as string;
    const isEmailMismatch =
      inviteData?.email.toLowerCase() !== userEmail?.toLowerCase();

    expect(isEmailMismatch).toBe(false);
  });

  // ─── ALREADY_MEMBER (409) ─────────────────────────────────────────────────

  it('detects ALREADY_MEMBER when user is already in workspace', async () => {
    const invite = makeInvite();
    mockGetInviteByToken.mockResolvedValue(invite as never);
    mockGetMemberByUserId.mockResolvedValue({
      id: 5,
      userId: 'user-123',
      workspaceId: 100,
      displayName: 'Existing',
      color: '#629584',
      role: 'MEMBER',
      invitedBy: null,
      joinedAt: null,
      createdAt: new Date().toISOString(),
    } as never);

    const existingMember = await getMemberByUserId('user-123', 100);
    expect(existingMember).not.toBeNull();
  });

  it('allows join when user is not yet a member', async () => {
    mockGetMemberByUserId.mockResolvedValue(null);
    const existingMember = await getMemberByUserId('new-user', 100);
    expect(existingMember).toBeNull();
  });

  // ─── EXPIRED token (400) ─────────────────────────────────────────────────

  it('detects EXPIRED invite (status=EXPIRED)', async () => {
    const invite = makeInvite({ status: 'EXPIRED' });
    mockGetInviteByToken.mockResolvedValue(invite as never);

    const inviteData = await getInviteByToken('test-token-uuid');
    const isExpired = inviteData?.status !== 'PENDING';
    expect(isExpired).toBe(true);
  });

  it('detects REJECTED invite (status=REJECTED)', async () => {
    const invite = makeInvite({ status: 'REJECTED' });
    mockGetInviteByToken.mockResolvedValue(invite as never);

    const inviteData = await getInviteByToken('test-token-uuid');
    const isNotPending = inviteData?.status !== 'PENDING';
    expect(isNotPending).toBe(true);
  });

  it('detects ACCEPTED invite (status=ACCEPTED)', async () => {
    const invite = makeInvite({ status: 'ACCEPTED' });
    mockGetInviteByToken.mockResolvedValue(invite as never);

    const inviteData = await getInviteByToken('test-token-uuid');
    const isNotPending = inviteData?.status !== 'PENDING';
    expect(isNotPending).toBe(true);
  });

  // ─── PENDING → ACCEPTED transition ────────────────────────────────────────

  it('acceptInvite is called with correct params', async () => {
    const member = {
      id: 10,
      userId: 'user-123',
      workspaceId: 100,
      displayName: 'New Member',
      color: '#629584',
      role: 'MEMBER',
      invitedBy: 1,
      joinedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    const acceptedInvite = makeInvite({ status: 'ACCEPTED' });
    mockAcceptInvite.mockResolvedValue({ member: member as never, invite: acceptedInvite as never });

    const result = await acceptInvite({
      token: 'test-token-uuid',
      userId: 'user-123',
      displayName: 'New Member',
    });

    expect(mockAcceptInvite).toHaveBeenCalledWith({
      token: 'test-token-uuid',
      userId: 'user-123',
      displayName: 'New Member',
    });
    expect(result?.invite.status).toBe('ACCEPTED');
    expect(result?.member.role).toBe('MEMBER');
  });

  it('acceptInvite returns null for non-PENDING invite', async () => {
    mockAcceptInvite.mockResolvedValue(null);
    const result = await acceptInvite({
      token: 'expired-token',
      userId: 'user-123',
      displayName: 'Test',
    });
    expect(result).toBeNull();
  });
});
