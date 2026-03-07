/**
 * Onboarding validation schema tests
 * patchUserTypeSchema, postJoinRequestSchema, patchJoinRequestSchema, workspaceSearchSchema
 */

import {
  patchUserTypeSchema,
  postJoinRequestSchema,
  patchJoinRequestSchema,
  workspaceSearchSchema,
} from '@/lib/validations';

// ─── patchUserTypeSchema ────────────────────────────────────────────────────

describe('patchUserTypeSchema', () => {
  it('accepts USER', () => {
    const r = patchUserTypeSchema.safeParse({ userType: 'USER' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.userType).toBe('USER');
  });

  it('accepts WORKSPACE', () => {
    const r = patchUserTypeSchema.safeParse({ userType: 'WORKSPACE' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.userType).toBe('WORKSPACE');
  });

  it('rejects unknown type', () => {
    const r = patchUserTypeSchema.safeParse({ userType: 'ADMIN' });
    expect(r.success).toBe(false);
  });

  it('rejects missing userType', () => {
    const r = patchUserTypeSchema.safeParse({});
    expect(r.success).toBe(false);
  });
});

// ─── postJoinRequestSchema ──────────────────────────────────────────────────

describe('postJoinRequestSchema', () => {
  it('accepts empty object (message is optional)', () => {
    const r = postJoinRequestSchema.safeParse({});
    expect(r.success).toBe(true);
  });

  it('accepts message within 500 chars', () => {
    const r = postJoinRequestSchema.safeParse({ message: '가입 신청합니다' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.message).toBe('가입 신청합니다');
  });

  it('rejects message longer than 500 chars', () => {
    const r = postJoinRequestSchema.safeParse({ message: 'a'.repeat(501) });
    expect(r.success).toBe(false);
  });

  it('accepts message exactly 500 chars', () => {
    const r = postJoinRequestSchema.safeParse({ message: 'a'.repeat(500) });
    expect(r.success).toBe(true);
  });
});

// ─── patchJoinRequestSchema ─────────────────────────────────────────────────

describe('patchJoinRequestSchema', () => {
  it('accepts APPROVE', () => {
    const r = patchJoinRequestSchema.safeParse({ action: 'APPROVE' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.action).toBe('APPROVE');
  });

  it('accepts REJECT', () => {
    const r = patchJoinRequestSchema.safeParse({ action: 'REJECT' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.action).toBe('REJECT');
  });

  it('rejects unknown action', () => {
    const r = patchJoinRequestSchema.safeParse({ action: 'DELETE' });
    expect(r.success).toBe(false);
  });

  it('rejects missing action', () => {
    const r = patchJoinRequestSchema.safeParse({});
    expect(r.success).toBe(false);
  });
});

// ─── workspaceSearchSchema ──────────────────────────────────────────────────

describe('workspaceSearchSchema', () => {
  it('accepts valid query string', () => {
    const r = workspaceSearchSchema.safeParse({ q: '팀 이름' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.q).toBe('팀 이름');
  });

  it('accepts query exactly 50 chars', () => {
    const r = workspaceSearchSchema.safeParse({ q: 'a'.repeat(50) });
    expect(r.success).toBe(true);
  });

  it('rejects empty query string', () => {
    const r = workspaceSearchSchema.safeParse({ q: '' });
    expect(r.success).toBe(false);
  });

  it('rejects query longer than 50 chars', () => {
    const r = workspaceSearchSchema.safeParse({ q: 'a'.repeat(51) });
    expect(r.success).toBe(false);
  });

  it('rejects missing q', () => {
    const r = workspaceSearchSchema.safeParse({});
    expect(r.success).toBe(false);
  });
});
