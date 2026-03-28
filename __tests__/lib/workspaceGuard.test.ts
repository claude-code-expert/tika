/**
 * workspaceGuard.test.ts — BUG-001 재발 방지 테스트
 *
 * checkTeamWorkspaceAccess() 가 모든 경계 케이스에서
 * 올바른 WorkspaceAccessResult를 반환하는지 검증한다.
 *
 * @see docs/BUG_REPORT.md — BUG-001
 * @see src/lib/workspaceGuard.ts
 */

import { checkTeamWorkspaceAccess } from '@/lib/workspaceGuard';

// ─── helpers ──────────────────────────────────────────────────────────────────

const teamWorkspace = { type: 'TEAM' };
const personalWorkspace = { type: 'PERSONAL' };
const member = { id: 1, role: 'OWNER' };

// ─── workspace null/undefined ─────────────────────────────────────────────────

describe('checkTeamWorkspaceAccess — workspace 없음', () => {
  it('workspace가 null이면 NOT_FOUND를 반환한다', () => {
    expect(checkTeamWorkspaceAccess(null, member)).toBe('NOT_FOUND');
  });

  it('workspace가 undefined이면 NOT_FOUND를 반환한다', () => {
    expect(checkTeamWorkspaceAccess(undefined, member)).toBe('NOT_FOUND');
  });
});

// ─── member null/undefined ────────────────────────────────────────────────────

describe('checkTeamWorkspaceAccess — member 없음', () => {
  it('member가 null이면 NOT_FOUND를 반환한다', () => {
    expect(checkTeamWorkspaceAccess(teamWorkspace, null)).toBe('NOT_FOUND');
  });

  it('member가 undefined이면 NOT_FOUND를 반환한다', () => {
    expect(checkTeamWorkspaceAccess(teamWorkspace, undefined)).toBe('NOT_FOUND');
  });

  it('workspace와 member 모두 null이면 NOT_FOUND를 반환한다', () => {
    expect(checkTeamWorkspaceAccess(null, null)).toBe('NOT_FOUND');
  });
});

// ─── PERSONAL 차단 (BUG-001 핵심) ────────────────────────────────────────────

describe('checkTeamWorkspaceAccess — PERSONAL 워크스페이스 차단 (BUG-001)', () => {
  it('PERSONAL 타입 워크스페이스는 PERSONAL을 반환한다', () => {
    expect(checkTeamWorkspaceAccess(personalWorkspace, member)).toBe('PERSONAL');
  });

  it('PERSONAL 타입 + OWNER 역할이어도 PERSONAL을 반환한다', () => {
    expect(checkTeamWorkspaceAccess(personalWorkspace, { id: 1, role: 'OWNER' })).toBe('PERSONAL');
  });

  it('PERSONAL 타입 + MEMBER 역할이어도 PERSONAL을 반환한다', () => {
    expect(checkTeamWorkspaceAccess(personalWorkspace, { id: 2, role: 'MEMBER' })).toBe('PERSONAL');
  });

  it('PERSONAL 타입 + VIEWER 역할이어도 PERSONAL을 반환한다', () => {
    expect(checkTeamWorkspaceAccess(personalWorkspace, { id: 3, role: 'VIEWER' })).toBe('PERSONAL');
  });

  it('member가 null이면 workspace 타입보다 NOT_FOUND가 우선한다', () => {
    // workspace가 PERSONAL이어도 member null 체크가 먼저
    expect(checkTeamWorkspaceAccess(personalWorkspace, null)).toBe('NOT_FOUND');
  });
});

// ─── TEAM 허용 ────────────────────────────────────────────────────────────────

describe('checkTeamWorkspaceAccess — TEAM 워크스페이스 허용', () => {
  it('TEAM 타입 + OWNER 역할은 OK를 반환한다', () => {
    expect(checkTeamWorkspaceAccess(teamWorkspace, { id: 1, role: 'OWNER' })).toBe('OK');
  });

  it('TEAM 타입 + MEMBER 역할은 OK를 반환한다', () => {
    expect(checkTeamWorkspaceAccess(teamWorkspace, { id: 2, role: 'MEMBER' })).toBe('OK');
  });

  it('TEAM 타입 + VIEWER 역할은 OK를 반환한다', () => {
    expect(checkTeamWorkspaceAccess(teamWorkspace, { id: 3, role: 'VIEWER' })).toBe('OK');
  });

  it('member가 빈 객체여도 TEAM + non-null이면 OK를 반환한다', () => {
    expect(checkTeamWorkspaceAccess(teamWorkspace, {})).toBe('OK');
  });
});

// ─── 타입 문자열 경계 케이스 ─────────────────────────────────────────────────

describe('checkTeamWorkspaceAccess — 타입 문자열 경계 케이스', () => {
  it('소문자 "personal"은 PERSONAL로 처리되지 않는다 (대소문자 구분)', () => {
    // DB 값은 항상 대문자이지만, 방어적 검증
    expect(checkTeamWorkspaceAccess({ type: 'personal' }, member)).toBe('OK');
  });

  it('빈 문자열 타입은 OK를 반환한다 (알 수 없는 타입은 차단하지 않음)', () => {
    expect(checkTeamWorkspaceAccess({ type: '' }, member)).toBe('OK');
  });

  it('알 수 없는 타입(예: "ENTERPRISE")은 OK를 반환한다', () => {
    expect(checkTeamWorkspaceAccess({ type: 'ENTERPRISE' }, member)).toBe('OK');
  });
});

// ─── 결과값 일관성 ────────────────────────────────────────────────────────────

describe('checkTeamWorkspaceAccess — 반환값 타입 일관성', () => {
  it("반환값은 항상 'OK' | 'NOT_FOUND' | 'PERSONAL' 중 하나다", () => {
    const validResults = new Set(['OK', 'NOT_FOUND', 'PERSONAL']);

    const cases: Array<[Parameters<typeof checkTeamWorkspaceAccess>[0], Parameters<typeof checkTeamWorkspaceAccess>[1]]> = [
      [null, null],
      [undefined, member],
      [teamWorkspace, null],
      [personalWorkspace, member],
      [teamWorkspace, member],
    ];

    for (const [ws, m] of cases) {
      const result = checkTeamWorkspaceAccess(ws, m);
      expect(validResults).toContain(result);
    }
  });
});
