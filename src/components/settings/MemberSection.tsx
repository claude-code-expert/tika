'use client';

import { useState, useEffect } from 'react';
import type { SectionProps } from './types';
import type { MemberWithEmail, MemberRole } from '@/types/index';

function ConfirmDialog({ title, message, confirmLabel, onConfirm, onCancel }: { title: string; message: string; confirmLabel: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(9,30,66,0.54)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 16px 48px rgba(0,0,0,.2)', padding: 24, maxWidth: 380, width: '90%' }}>
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{title}</div>
        <div style={{ fontSize: 12, color: '#5A6B7F', lineHeight: 1.6, marginBottom: 20, whiteSpace: 'pre-line' }}>{message}</div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onCancel} style={{ height: 32, padding: '0 14px', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer', background: '#fff', border: '1px solid #DFE1E6', color: '#5A6B7F' }}>취소</button>
          <button onClick={onConfirm} style={{ height: 32, padding: '0 14px', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer', background: '#fff', border: '1px solid #FECACA', color: '#DC2626' }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

export function MemberSection({ showToast }: SectionProps) {
  const [members, setMembers] = useState<MemberWithEmail[]>([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [confirmRole, setConfirmRole] = useState<{ member: MemberWithEmail; newRole: MemberRole } | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<MemberWithEmail | null>(null);

  useEffect(() => {
    fetchMembers();
  }, []);

  async function fetchMembers() {
    try {
      const res = await fetch('/api/members');
      const data = (await res.json()) as { members?: MemberWithEmail[] };
      setMembers(data.members ?? []);
    } catch {
      // ignore
    }
  }

  async function handleRoleChange(member: MemberWithEmail, newRole: MemberRole) {
    const adminCount = members.filter((m) => m.role === 'admin').length;
    if (member.role === 'admin' && newRole === 'member' && adminCount <= 1) {
      showToast('관리자가 최소 1명 이상이어야 합니다', 'fail');
      return;
    }
    setConfirmRole({ member, newRole });
  }

  async function doRoleChange() {
    if (!confirmRole) return;
    const { member, newRole } = confirmRole;
    setConfirmRole(null);
    try {
      const res = await fetch(`/api/members/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: { message?: string } };
        showToast(data.error?.message ?? '역할 변경 실패', 'fail');
        return;
      }
      await fetchMembers();
      showToast(`${member.displayName}의 역할이 ${newRole === 'admin' ? '관리자' : '멤버'}로 변경되었습니다`, 'success');
    } catch {
      showToast('역할 변경 중 오류가 발생했습니다', 'fail');
    }
  }

  async function doRemove() {
    if (!confirmRemove) return;
    const member = confirmRemove;
    setConfirmRemove(null);
    try {
      const res = await fetch(`/api/members/${member.id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) {
        const data = (await res.json()) as { error?: { message?: string } };
        showToast(data.error?.message ?? '제거 실패', 'fail');
        return;
      }
      await fetchMembers();
      showToast(`${member.displayName}이(가) 제거되었습니다`, 'success');
    } catch {
      showToast('제거 중 오류가 발생했습니다', 'fail');
    }
  }

  const adminCount = members.filter((m) => m.role === 'admin').length;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 18, fontWeight: 600, color: '#2C3E50', display: 'flex', alignItems: 'baseline', gap: 4 }}>
          멤버 관리
          <span style={{ fontSize: 12, fontWeight: 400, color: '#8993A4' }}>({members.length}명)</span>
        </h2>
        <button
          onClick={() => setInviteOpen((v) => !v)}
          style={{ height: 32, padding: '0 14px', borderRadius: 6, fontFamily: "'Noto Sans KR', sans-serif", fontSize: 12, fontWeight: 500, cursor: 'pointer', background: '#629584', color: '#fff', border: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <span style={{ fontSize: 15, lineHeight: 1 }}>+</span> 멤버 초대
        </button>
      </div>
      <p style={{ fontSize: 12, color: '#8993A4', marginBottom: 20, lineHeight: 1.6 }}>
        프로젝트 멤버를 관리합니다. Google OAuth로 가입된 사용자를 이메일로 초대할 수 있습니다.
      </p>

      {/* Invite Form */}
      {inviteOpen && (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, padding: 14, background: '#F1F3F6', border: '1px dashed #C4C9D1', borderRadius: 8, marginBottom: 12 }}>
          <input
            autoFocus
            style={{ flex: 1, minWidth: 200, height: 30, padding: '0 8px', border: '1px solid #DFE1E6', borderRadius: 4, fontFamily: "'Noto Sans KR', sans-serif", fontSize: 12, outline: 'none', background: '#fff', color: '#2C3E50' }}
            type="email"
            placeholder="이메일 주소"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Escape') setInviteOpen(false); }}
          />
          <button
            onClick={() => { showToast('멤버 초대 기능은 준비 중입니다', 'info'); setInviteOpen(false); setInviteEmail(''); }}
            style={{ height: 30, padding: '0 12px', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: 'pointer', background: '#629584', color: '#fff', border: 'none' }}
          >
            초대
          </button>
          <button onClick={() => setInviteOpen(false)} style={{ height: 30, padding: '0 8px', borderRadius: 6, fontSize: 12, cursor: 'pointer', background: 'transparent', border: 'none', color: '#8993A4' }}>취소</button>
        </div>
      )}

      {/* Member List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {members.map((member) => {
          const isAdmin = member.role === 'admin';
          const canRemove = !(isAdmin && adminCount <= 1);
          const newRole: MemberRole = isAdmin ? 'member' : 'admin';
          const initial = member.displayName.slice(0, 1).toUpperCase();

          return (
            <div key={member.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: '#fff', border: '1px solid #DFE1E6', borderRadius: 6 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: member.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
                {initial}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 500 }}>{member.displayName}</div>
                <div style={{ fontSize: 11, color: '#8993A4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.email}</div>
              </div>
              <span style={{ fontSize: 10, fontWeight: 500, padding: '3px 10px', borderRadius: 10, flexShrink: 0, whiteSpace: 'nowrap', background: isAdmin ? '#E0E7FF' : '#F1F3F6', color: isAdmin ? '#4338CA' : '#8993A4' }}>
                {isAdmin ? '관리자' : '멤버'}
              </span>
              <span style={{ fontSize: 11, color: '#8993A4', whiteSpace: 'nowrap', flexShrink: 0 }}>
                {member.createdAt.slice(0, 10)}
              </span>
              <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                <button
                  onClick={() => handleRoleChange(member, newRole)}
                  title="역할 변경"
                  style={{ width: 28, height: 28, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', borderRadius: 4, color: '#8993A4', cursor: 'pointer' }}
                >
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx={9} cy={7} r={4} />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </button>
                {canRemove && (
                  <button
                    onClick={() => setConfirmRemove(member)}
                    title="제거"
                    style={{ width: 28, height: 28, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', borderRadius: 4, color: '#8993A4', cursor: 'pointer' }}
                  >
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {members.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', fontSize: 12, color: '#8993A4' }}>
            멤버 목록을 불러오는 중...
          </div>
        )}
      </div>

      {confirmRole && (
        <ConfirmDialog
          title="역할 변경"
          message={`"${confirmRole.member.displayName}"의 역할을 ${confirmRole.newRole === 'admin' ? '관리자' : '멤버'}(으)로 변경하시겠습니까?`}
          confirmLabel="변경"
          onConfirm={doRoleChange}
          onCancel={() => setConfirmRole(null)}
        />
      )}
      {confirmRemove && (
        <ConfirmDialog
          title="멤버 제거"
          message={`"${confirmRemove.displayName}" (${confirmRemove.email})을(를) 프로젝트에서 제거하시겠습니까?`}
          confirmLabel="제거"
          onConfirm={doRemove}
          onCancel={() => setConfirmRemove(null)}
        />
      )}
    </div>
  );
}
