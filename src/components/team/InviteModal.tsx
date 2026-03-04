'use client';

import { useState, useEffect, useRef } from 'react';
import type { TeamRole } from '@/types/index';

interface PendingInvite {
  id: number;
  email: string;
  role: TeamRole;
  expiresAt: string;
}

interface InviteModalProps {
  workspaceId: number;
  onClose: () => void;
}

export function InviteModal({ workspaceId, onClose }: InviteModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'MEMBER' | 'VIEWER'>('MEMBER');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(true);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    emailRef.current?.focus();
    loadInvites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadInvites() {
    setLoadingInvites(true);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/invites`);
      if (res.ok) {
        const data = await res.json();
        setPendingInvites(data.invites ?? []);
      }
    } finally {
      setLoadingInvites(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    setError('');
    setInviteLink('');

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message ?? '초대 생성에 실패했습니다');
        return;
      }
      const token = data.invite?.token;
      if (token) {
        setInviteLink(`${window.location.origin}/invite/${token}`);
      }
      setEmail('');
      loadInvites();
    } catch {
      setError('네트워크 오류가 발생했습니다');
    } finally {
      setSubmitting(false);
    }
  }

  async function revokeInvite(inviteId: number) {
    try {
      await fetch(`/api/workspaces/${workspaceId}/invites/${inviteId}`, { method: 'DELETE' });
      loadInvites();
    } catch {
      // ignore
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          padding: 24,
          width: 480,
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#2C3E50', margin: 0 }}>팀원 초대</h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#9CA3AF', padding: 4 }}
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
              이메일 주소
            </label>
            <input
              ref={emailRef}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@company.com"
              required
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 7,
                border: '1px solid #E5E7EB',
                fontSize: 13,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
              역할
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'MEMBER' | 'VIEWER')}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 7,
                border: '1px solid #E5E7EB',
                fontSize: 13,
                outline: 'none',
                background: '#fff',
              }}
            >
              <option value="MEMBER">멤버 — 티켓 생성/수정 가능</option>
              <option value="VIEWER">뷰어 — 읽기 전용</option>
            </select>
          </div>
          {error && <div style={{ fontSize: 12, color: '#DC2626' }}>{error}</div>}
          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: '9px 16px',
              borderRadius: 7,
              background: '#629584',
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              border: 'none',
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? '초대 중...' : '초대 링크 생성'}
          </button>
        </form>

        {/* Generated link */}
        {inviteLink && (
          <div
            style={{
              padding: 12,
              borderRadius: 8,
              background: '#F0FDF4',
              border: '1px solid #86EFAC',
              marginBottom: 20,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 600, color: '#16A34A', marginBottom: 6 }}>
              초대 링크가 생성되었습니다
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                readOnly
                value={inviteLink}
                style={{
                  flex: 1,
                  padding: '6px 8px',
                  borderRadius: 5,
                  border: '1px solid #86EFAC',
                  fontSize: 11,
                  background: '#fff',
                  outline: 'none',
                }}
              />
              <button
                onClick={() => navigator.clipboard.writeText(inviteLink)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 5,
                  border: '1px solid #86EFAC',
                  background: '#fff',
                  fontSize: 11,
                  cursor: 'pointer',
                  fontWeight: 600,
                  color: '#16A34A',
                  whiteSpace: 'nowrap',
                }}
              >
                복사
              </button>
            </div>
          </div>
        )}

        {/* Pending invites */}
        {!loadingInvites && pendingInvites.length > 0 && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
              대기 중인 초대 ({pendingInvites.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {pendingInvites.map((inv) => (
                <div
                  key={inv.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '7px 10px',
                    borderRadius: 7,
                    background: '#F9FAFB',
                    border: '1px solid #F3F4F6',
                    gap: 8,
                  }}
                >
                  <span style={{ flex: 1, fontSize: 12, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {inv.email}
                  </span>
                  <span style={{ fontSize: 10, color: '#9CA3AF', whiteSpace: 'nowrap' }}>
                    {inv.role === 'MEMBER' ? '멤버' : '뷰어'}
                  </span>
                  <button
                    onClick={() => revokeInvite(inv.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#EF4444',
                      fontSize: 11,
                      cursor: 'pointer',
                      padding: '2px 6px',
                      borderRadius: 4,
                    }}
                  >
                    취소
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
