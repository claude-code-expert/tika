/**
 * @jest-environment node
 *
 * Tests for buildSessionUser — session user data builder
 *
 * Implementation note (parallel queries):
 *  buildSessionUser runs all 3 DB queries concurrently via Promise.all:
 *  1. users table query (simple where chain)
 *  2. members table — is_primary=true (simple where chain)
 *  3. members INNER JOIN workspaces WHERE type='PERSONAL' (innerJoin chain)
 *  All 3 queries always execute regardless of the result.
 */

jest.mock('next-auth', () => {
  const mockNextAuth = jest.fn(() => ({
    auth: jest.fn(),
    handlers: {},
    signIn: jest.fn(),
    signOut: jest.fn(),
  }));
  return { __esModule: true, default: mockNextAuth };
});
jest.mock('next-auth/providers/google', () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock('@/lib/constants', () => ({ DEFAULT_LABELS: [] }));
jest.mock('drizzle-orm', () => ({ eq: jest.fn(), and: jest.fn() }));

jest.mock('@/db/index', () => ({
  db: { select: jest.fn() },
}));
jest.mock('@/db/schema', () => ({
  users: {},
  workspaces: {},
  members: {},
  labels: {},
}));

import { buildSessionUser } from '@/lib/auth';
import { db } from '@/db/index';

const mockedSelect = db.select as jest.Mock;

/** Simple where chain: select→from→where→limit */
function sel(rows: unknown[]) {
  return {
    from: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue(rows),
      }),
    }),
  };
}

/** innerJoin chain: select→from→innerJoin→where→limit */
function selJoin(rows: unknown[]) {
  return {
    from: jest.fn().mockReturnValue({
      innerJoin: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue(rows),
        }),
      }),
    }),
  };
}

/** Error chain (simple where) */
function selErr(message: string) {
  return {
    from: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnValue({
        limit: jest.fn().mockRejectedValue(new Error(message)),
      }),
    }),
  };
}

/** Error chain (innerJoin) */
function selJoinErr(message: string) {
  return {
    from: jest.fn().mockReturnValue({
      innerJoin: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockRejectedValue(new Error(message)),
        }),
      }),
    }),
  };
}

beforeEach(() => jest.clearAllMocks());

// ─── Stale JWT — user not in DB ─────────────────────────────────────────────

describe('buildSessionUser — stale JWT (user not in DB)', () => {
  it('returns null when users table has no matching row', async () => {
    // All 3 queries run in parallel — provide mocks for all 3
    mockedSelect
      .mockReturnValueOnce(sel([]))      // users: not found
      .mockReturnValueOnce(sel([]))      // primaryMember: none (result ignored)
      .mockReturnValueOnce(selJoin([])); // personalMember: none (result ignored)
    expect(await buildSessionUser('ghost-id')).toBeNull();
  });

  it('performs exactly 3 DB queries (all run in parallel)', async () => {
    mockedSelect
      .mockReturnValueOnce(sel([]))
      .mockReturnValueOnce(sel([]))
      .mockReturnValueOnce(selJoin([]));
    await buildSessionUser('ghost-id');
    expect(mockedSelect).toHaveBeenCalledTimes(3);
  });
});

// ─── NULL type (onboarding incomplete) ──────────────────────────────────────

describe('buildSessionUser — NULL type (onboarding)', () => {
  it('returns object with nulls (not null itself)', async () => {
    mockedSelect
      .mockReturnValueOnce(sel([{ id: 'new', userType: null }]))
      .mockReturnValueOnce(sel([]))
      .mockReturnValueOnce(selJoin([]));
    const result = await buildSessionUser('new');
    expect(result).toEqual({ id: 'new', userType: null, workspaceId: null, memberId: null });
  });

  it('performs exactly 3 DB queries (all run in parallel)', async () => {
    mockedSelect
      .mockReturnValueOnce(sel([{ id: 'new', userType: null }]))
      .mockReturnValueOnce(sel([]))
      .mockReturnValueOnce(selJoin([]));
    await buildSessionUser('new');
    expect(mockedSelect).toHaveBeenCalledTimes(3);
  });
});

// ─── Primary found ───────────────────────────────────────────────────────────

describe('buildSessionUser — primary member found', () => {
  it('returns primary workspaceId and memberId for USER type', async () => {
    mockedSelect
      .mockReturnValueOnce(sel([{ id: 'u1', userType: 'USER' }]))
      .mockReturnValueOnce(sel([{ id: 5, workspaceId: 10 }]))  // is_primary=true member
      .mockReturnValueOnce(selJoin([]));                        // personal ws (ignored)

    const result = await buildSessionUser('u1');
    expect(result).toEqual({ id: 'u1', userType: 'USER', workspaceId: 10, memberId: 5 });
  });

  it('returns primary workspaceId and memberId for WORKSPACE type', async () => {
    mockedSelect
      .mockReturnValueOnce(sel([{ id: 'u2', userType: 'WORKSPACE' }]))
      .mockReturnValueOnce(sel([{ id: 7, workspaceId: 42 }]))
      .mockReturnValueOnce(selJoin([]));

    const result = await buildSessionUser('u2');
    expect(result).toEqual({ id: 'u2', userType: 'WORKSPACE', workspaceId: 42, memberId: 7 });
  });

  it('performs exactly 3 DB queries', async () => {
    mockedSelect
      .mockReturnValueOnce(sel([{ id: 'u1', userType: 'USER' }]))
      .mockReturnValueOnce(sel([{ id: 5, workspaceId: 10 }]))
      .mockReturnValueOnce(selJoin([]));

    await buildSessionUser('u1');
    expect(mockedSelect).toHaveBeenCalledTimes(3);
  });

  it('uses primary workspace result over personal workspace when both exist', async () => {
    mockedSelect
      .mockReturnValueOnce(sel([{ id: 'u1', userType: 'USER' }]))
      .mockReturnValueOnce(sel([{ id: 5, workspaceId: 10 }]))   // primary → workspaceId=10
      .mockReturnValueOnce(selJoin([{ id: 7, workspaceId: 99 }])); // personal → workspaceId=99

    const result = await buildSessionUser('u1');
    // primary (10) wins over personal (99)
    expect(result?.workspaceId).toBe(10);
  });
});

// ─── Fallback — no primary, use personal workspace ───────────────────────────

describe('buildSessionUser — no primary, fallback to personal workspace', () => {
  it('returns personal workspace when no is_primary member exists', async () => {
    mockedSelect
      .mockReturnValueOnce(sel([{ id: 'u1', userType: 'USER' }]))
      .mockReturnValueOnce(sel([]))                                    // no primary
      .mockReturnValueOnce(selJoin([{ id: 3, workspaceId: 1 }]));     // personal ws

    const result = await buildSessionUser('u1');
    expect(result).toEqual({ id: 'u1', userType: 'USER', workspaceId: 1, memberId: 3 });
  });

  it('returns null workspaceId and memberId when no primary and no personal workspace', async () => {
    mockedSelect
      .mockReturnValueOnce(sel([{ id: 'u1', userType: 'USER' }]))
      .mockReturnValueOnce(sel([]))      // no primary
      .mockReturnValueOnce(selJoin([])); // no personal ws

    const result = await buildSessionUser('u1');
    expect(result).toEqual({ id: 'u1', userType: 'USER', workspaceId: null, memberId: null });
  });

  it('performs exactly 3 DB queries', async () => {
    mockedSelect
      .mockReturnValueOnce(sel([{ id: 'u1', userType: 'USER' }]))
      .mockReturnValueOnce(sel([]))
      .mockReturnValueOnce(selJoin([]));

    await buildSessionUser('u1');
    expect(mockedSelect).toHaveBeenCalledTimes(3);
  });
});

// ─── DB error propagation ────────────────────────────────────────────────────

describe('buildSessionUser — DB error propagation', () => {
  it('propagates error from users table query', async () => {
    mockedSelect
      .mockReturnValueOnce(selErr('users query failed'))
      .mockReturnValueOnce(sel([]))
      .mockReturnValueOnce(selJoin([]));
    await expect(buildSessionUser('u1')).rejects.toThrow('users query failed');
  });

  it('propagates error from primary members query', async () => {
    mockedSelect
      .mockReturnValueOnce(sel([{ id: 'u1', userType: 'USER' }]))
      .mockReturnValueOnce(selErr('primary query failed'))
      .mockReturnValueOnce(selJoin([]));

    await expect(buildSessionUser('u1')).rejects.toThrow('primary query failed');
  });

  it('propagates error from fallback personal workspace query', async () => {
    mockedSelect
      .mockReturnValueOnce(sel([{ id: 'u1', userType: 'USER' }]))
      .mockReturnValueOnce(sel([]))
      .mockReturnValueOnce(selJoinErr('fallback query failed'));

    await expect(buildSessionUser('u1')).rejects.toThrow('fallback query failed');
  });
});

// ─── Return shape invariants ─────────────────────────────────────────────────

describe('buildSessionUser — return shape', () => {
  it('always returns tokenSub as id when user exists', async () => {
    for (const userType of ['USER', 'WORKSPACE', null] as const) {
      jest.clearAllMocks();
      mockedSelect
        .mockReturnValueOnce(sel([{ id: 'my-sub', userType }]))
        .mockReturnValueOnce(sel(userType ? [{ id: 5, workspaceId: 10 }] : []))
        .mockReturnValueOnce(selJoin([]));

      const result = await buildSessionUser('my-sub');
      expect(result?.id).toBe('my-sub');
    }
  });

  it('null only when user row absent, not when userType is null', async () => {
    mockedSelect
      .mockReturnValueOnce(sel([{ id: 'u', userType: null }]))
      .mockReturnValueOnce(sel([]))
      .mockReturnValueOnce(selJoin([]));
    expect(await buildSessionUser('u')).not.toBeNull();

    jest.clearAllMocks();
    mockedSelect
      .mockReturnValueOnce(sel([]))
      .mockReturnValueOnce(sel([]))
      .mockReturnValueOnce(selJoin([]));
    expect(await buildSessionUser('u')).toBeNull();
  });

  it('returned object always has all 4 fields', async () => {
    mockedSelect
      .mockReturnValueOnce(sel([{ id: 'u1', userType: 'USER' }]))
      .mockReturnValueOnce(sel([{ id: 5, workspaceId: 10 }]))
      .mockReturnValueOnce(selJoin([]));

    const result = await buildSessionUser('u1');
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('userType');
    expect(result).toHaveProperty('workspaceId');
    expect(result).toHaveProperty('memberId');
  });
});
