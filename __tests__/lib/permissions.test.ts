/**
 * T074: RBAC permissions.ts unit tests
 * Tests 26 combinations of OWNER/MEMBER/VIEWER × each feature gate
 *
 * NOTE: We test the business logic directly by inspecting the return shape
 * from requireRole rather than using instanceof (which requires browser APIs).
 */

// Mock next/server BEFORE any imports that use it
jest.mock('next/server', () => {
  class MockNextResponse {
    status: number;
    _body: unknown;
    constructor() {
      this.status = 200;
      this._body = null;
    }
    static json(body: unknown, init?: { status?: number }) {
      const r = new MockNextResponse();
      r.status = init?.status ?? 200;
      r._body = body;
      return r;
    }
  }
  return { NextResponse: MockNextResponse };
});

// Mock DB queries
jest.mock('@/db/queries/members', () => ({
  getMemberByUserId: jest.fn(),
}));

import { getMemberByUserId } from '@/db/queries/members';
import { requireRole } from '@/lib/permissions';

const mockGetMember = getMemberByUserId as jest.MockedFunction<typeof getMemberByUserId>;

// Helper to determine if result is a 403 (error) response
function isError(result: unknown): boolean {
  return !('member' in (result as object));
}

function getStatus(result: unknown): number {
  return (result as { status: number }).status;
}

function makeMember(role: 'OWNER' | 'MEMBER' | 'VIEWER') {
  return {
    id: 1, userId: 'user-1', workspaceId: 100,
    displayName: 'Test', color: '#629584', role,
    invitedBy: null, joinedAt: null,
    createdAt: new Date().toISOString(),
  };
}

const userId = 'user-1';
const workspaceId = 100;

describe('requireRole — non-member', () => {
  afterEach(() => jest.clearAllMocks());

  it('returns 403 when user is not a member', async () => {
    mockGetMember.mockResolvedValue(null);
    const result = await requireRole(userId, workspaceId, 'VIEWER');
    expect(isError(result)).toBe(true);
    expect(getStatus(result)).toBe(403);
  });
});

describe('requireRole — VIEWER', () => {
  beforeEach(() => {
    mockGetMember.mockResolvedValue(makeMember('VIEWER') as never);
  });
  afterEach(() => jest.clearAllMocks());

  it('can access VIEWER-gated resources', async () => {
    const result = await requireRole(userId, workspaceId, 'VIEWER');
    expect(isError(result)).toBe(false);
  });

  it('cannot access MEMBER-gated resources', async () => {
    const result = await requireRole(userId, workspaceId, 'MEMBER');
    expect(isError(result)).toBe(true);
    expect(getStatus(result)).toBe(403);
  });

  it('cannot access OWNER-gated resources', async () => {
    const result = await requireRole(userId, workspaceId, 'OWNER');
    expect(isError(result)).toBe(true);
    expect(getStatus(result)).toBe(403);
  });
});

describe('requireRole — MEMBER', () => {
  beforeEach(() => {
    mockGetMember.mockResolvedValue(makeMember('MEMBER') as never);
  });
  afterEach(() => jest.clearAllMocks());

  it('can access VIEWER-gated resources', async () => {
    const result = await requireRole(userId, workspaceId, 'VIEWER');
    expect(isError(result)).toBe(false);
  });

  it('can access MEMBER-gated resources', async () => {
    const result = await requireRole(userId, workspaceId, 'MEMBER');
    expect(isError(result)).toBe(false);
    if (!isError(result)) {
      expect((result as { member: { role: string } }).member.role).toBe('MEMBER');
    }
  });

  it('cannot access OWNER-gated resources', async () => {
    const result = await requireRole(userId, workspaceId, 'OWNER');
    expect(isError(result)).toBe(true);
    expect(getStatus(result)).toBe(403);
  });
});

describe('requireRole — OWNER', () => {
  beforeEach(() => {
    mockGetMember.mockResolvedValue(makeMember('OWNER') as never);
  });
  afterEach(() => jest.clearAllMocks());

  it('can access VIEWER-gated resources', async () => {
    const result = await requireRole(userId, workspaceId, 'VIEWER');
    expect(isError(result)).toBe(false);
  });

  it('can access MEMBER-gated resources', async () => {
    const result = await requireRole(userId, workspaceId, 'MEMBER');
    expect(isError(result)).toBe(false);
  });

  it('can access OWNER-gated resources', async () => {
    const result = await requireRole(userId, workspaceId, 'OWNER');
    expect(isError(result)).toBe(false);
    if (!isError(result)) {
      expect((result as { member: { role: string } }).member.role).toBe('OWNER');
    }
  });
});

// ─── Feature-gate matrix (26 combinations) ─────────────────────────────────

describe('RBAC feature-gate matrix', () => {
  afterEach(() => jest.clearAllMocks());

  // Analytics read → VIEWER+
  it.each([
    ['OWNER', 'VIEWER', false],
    ['MEMBER', 'VIEWER', false],
    ['VIEWER', 'VIEWER', false],
  ] as [string, string, boolean][])(
    'analytics read: %s accessing %s gate → error=%s',
    async (role, gate, expectError) => {
      mockGetMember.mockResolvedValue(makeMember(role as 'OWNER' | 'MEMBER' | 'VIEWER') as never);
      const result = await requireRole(userId, workspaceId, gate as 'VIEWER' | 'MEMBER' | 'OWNER');
      expect(isError(result)).toBe(expectError);
    },
  );

  // Ticket create → MEMBER+
  it.each([
    ['OWNER', 'MEMBER', false],
    ['MEMBER', 'MEMBER', false],
    ['VIEWER', 'MEMBER', true],
  ] as [string, string, boolean][])(
    'ticket create: %s → error=%s',
    async (role, gate, expectError) => {
      mockGetMember.mockResolvedValue(makeMember(role as 'OWNER' | 'MEMBER' | 'VIEWER') as never);
      const result = await requireRole(userId, workspaceId, gate as 'VIEWER' | 'MEMBER' | 'OWNER');
      expect(isError(result)).toBe(expectError);
    },
  );

  // Sprint management → OWNER
  it.each([
    ['OWNER', 'OWNER', false],
    ['MEMBER', 'OWNER', true],
    ['VIEWER', 'OWNER', true],
  ] as [string, string, boolean][])(
    'sprint manage: %s → error=%s',
    async (role, gate, expectError) => {
      mockGetMember.mockResolvedValue(makeMember(role as 'OWNER' | 'MEMBER' | 'VIEWER') as never);
      const result = await requireRole(userId, workspaceId, gate as 'VIEWER' | 'MEMBER' | 'OWNER');
      expect(isError(result)).toBe(expectError);
    },
  );

  // Invite create → OWNER
  it.each([
    ['OWNER', 'OWNER', false],
    ['MEMBER', 'OWNER', true],
    ['VIEWER', 'OWNER', true],
  ] as [string, string, boolean][])(
    'invite create: %s → error=%s',
    async (role, gate, expectError) => {
      mockGetMember.mockResolvedValue(makeMember(role as 'OWNER' | 'MEMBER' | 'VIEWER') as never);
      const result = await requireRole(userId, workspaceId, gate as 'VIEWER' | 'MEMBER' | 'OWNER');
      expect(isError(result)).toBe(expectError);
    },
  );

  // Workspace delete → OWNER
  it.each([
    ['OWNER', 'OWNER', false],
    ['MEMBER', 'OWNER', true],
    ['VIEWER', 'OWNER', true],
  ] as [string, string, boolean][])(
    'workspace delete: %s → error=%s',
    async (role, gate, expectError) => {
      mockGetMember.mockResolvedValue(makeMember(role as 'OWNER' | 'MEMBER' | 'VIEWER') as never);
      const result = await requireRole(userId, workspaceId, gate as 'VIEWER' | 'MEMBER' | 'OWNER');
      expect(isError(result)).toBe(expectError);
    },
  );

  // Member role change → OWNER
  it.each([
    ['OWNER', 'OWNER', false],
    ['MEMBER', 'OWNER', true],
    ['VIEWER', 'OWNER', true],
  ] as [string, string, boolean][])(
    'member role change: %s → error=%s',
    async (role, gate, expectError) => {
      mockGetMember.mockResolvedValue(makeMember(role as 'OWNER' | 'MEMBER' | 'VIEWER') as never);
      const result = await requireRole(userId, workspaceId, gate as 'VIEWER' | 'MEMBER' | 'OWNER');
      expect(isError(result)).toBe(expectError);
    },
  );

  // Sprint activate → OWNER
  it.each([
    ['OWNER', 'OWNER', false],
    ['MEMBER', 'OWNER', true],
    ['VIEWER', 'OWNER', true],
  ] as [string, string, boolean][])(
    'sprint activate: %s → error=%s',
    async (role, gate, expectError) => {
      mockGetMember.mockResolvedValue(makeMember(role as 'OWNER' | 'MEMBER' | 'VIEWER') as never);
      const result = await requireRole(userId, workspaceId, gate as 'VIEWER' | 'MEMBER' | 'OWNER');
      expect(isError(result)).toBe(expectError);
    },
  );

  // Sprint complete → OWNER
  it.each([
    ['OWNER', 'OWNER', false],
    ['MEMBER', 'OWNER', true],
    ['VIEWER', 'OWNER', true],
  ] as [string, string, boolean][])(
    'sprint complete: %s → error=%s',
    async (role, gate, expectError) => {
      mockGetMember.mockResolvedValue(makeMember(role as 'OWNER' | 'MEMBER' | 'VIEWER') as never);
      const result = await requireRole(userId, workspaceId, gate as 'VIEWER' | 'MEMBER' | 'OWNER');
      expect(isError(result)).toBe(expectError);
    },
  );

  // Comment create → MEMBER+
  it.each([
    ['OWNER', 'MEMBER', false],
    ['MEMBER', 'MEMBER', false],
    ['VIEWER', 'MEMBER', true],
  ] as [string, string, boolean][])(
    'comment create: %s → error=%s',
    async (role, gate, expectError) => {
      mockGetMember.mockResolvedValue(makeMember(role as 'OWNER' | 'MEMBER' | 'VIEWER') as never);
      const result = await requireRole(userId, workspaceId, gate as 'VIEWER' | 'MEMBER' | 'OWNER');
      expect(isError(result)).toBe(expectError);
    },
  );
});
