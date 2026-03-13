'use client';

import { useState, useEffect } from 'react';
import { Link2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { RoleBadge, ROLE_STYLES } from '@/components/ui/RoleBadge';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import type { SectionProps } from './types';
import { TEAM_ROLE } from '@/types/index';
import type { MemberWithEmail, MemberRole, JoinRequestWithUser, WorkspaceWithRole } from '@/types/index';

type TransferTarget = MemberWithEmail;

export function MemberSection({ showToast, workspaceId }: SectionProps) {
  const [workspaces, setWorkspaces] = useState<WorkspaceWithRole[]>([]);
  const [selectedWsId, setSelectedWsId] = useState<number>(workspaceId);
  const [members, setMembers] = useState<MemberWithEmail[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequestWithUser[]>([]);
  const [processingReqId, setProcessingReqId] = useState<number | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteRole, setInviteRole] = useState<'MEMBER' | 'VIEWER'>('MEMBER');
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [confirmRole, setConfirmRole] = useState<{ member: MemberWithEmail; newRole: MemberRole } | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<MemberWithEmail | null>(null);
  const [transferTarget, setTransferTarget] = useState<TransferTarget | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Derived — hoisted above effects so effects can use the stable boolean
  const adminCount = members.filter((m) => m.role === 'OWNER').length;
  const isOwner = members.some((m) => m.userId === currentUserId && m.role === 'OWNER');

  // Fetch workspaces for the workspace selector
  useEffect(() => {
    fetch('/api/workspaces')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { workspaces?: WorkspaceWithRole[] } | null) => {
        const list = data?.workspaces ?? [];
        setWorkspaces(list);
        // Auto-select first workspace when initial workspaceId is invalid (0 or not in list)
        if (list.length > 0 && !list.some((ws) => ws.id === selectedWsId)) {
          setSelectedWsId(list[0].id);
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchMembers(selectedWsId);
    fetch('/api/auth/session')
      .then((r) => r.json())
      .then((data: { user?: { id?: string } }) => {
        if (data.user?.id) setCurrentUserId(data.user.id);
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWsId]);

  // Fetch join requests when OWNER status changes (not on every members array update)
  useEffect(() => {
    if (!currentUserId || !selectedWsId || !isOwner) {
      setJoinRequests([]);
      return;
    }
    fetch(`/api/workspaces/${selectedWsId}/join-requests`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { joinRequests?: JoinRequestWithUser[] } | null) => {
        setJoinRequests(data?.joinRequests ?? []);
      })
      .catch(() => {});
  }, [currentUserId, isOwner, selectedWsId]);

  async function fetchMembers(wsId?: number) {
    const targetWsId = wsId ?? selectedWsId;
    if (!targetWsId) return;
    try {
      const res = await fetch(`/api/workspaces/${targetWsId}/members`);
      const data = (await res.json()) as { members?: MemberWithEmail[] };
      setMembers(data.members ?? []);
    } catch {
      // ignore
    }
  }

  async function handleJoinRequest(reqId: number, action: 'APPROVE' | 'REJECT') {
    setProcessingReqId(reqId);
    try {
      const res = await fetch(`/api/workspaces/${selectedWsId}/join-requests/${reqId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: { message?: string } };
        showToast(data.error?.message ?? '처리 실패', 'fail');
        return;
      }
      setJoinRequests((prev) => prev.filter((r) => r.id !== reqId));
      if (action === 'APPROVE') {
        await fetchMembers();
        showToast('가입 신청을 승인했습니다', 'success');
      } else {
        showToast('가입 신청을 거절했습니다', 'success');
      }
    } catch {
      showToast('처리 중 오류가 발생했습니다', 'fail');
    } finally {
      setProcessingReqId(null);
    }
  }

  async function handleRoleChange(member: MemberWithEmail, newRole: MemberRole) {
    if (newRole === member.role) return;
    if (member.role === 'OWNER' && adminCount <= 1) {
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
      const res = await fetch(`/api/workspaces/${selectedWsId}/members/${member.id}`, {
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
      showToast(`${member.displayName}의 역할이 ${ROLE_STYLES[newRole].label}로 변경되었습니다`, 'success');
    } catch {
      showToast('역할 변경 중 오류가 발생했습니다', 'fail');
    }
  }

  async function generateInviteLink(role: 'MEMBER' | 'VIEWER') {
    setIsGenerating(true);
    try {
      const res = await fetch(`/api/workspaces/${selectedWsId}/invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      const data = (await res.json()) as { inviteUrl?: string; error?: { message?: string } };
      if (!res.ok) { showToast(data.error?.message ?? '링크 생성 실패', 'fail'); return; }
      setGeneratedLink(data.inviteUrl ?? '');
    } catch {
      showToast('링크 생성 중 오류가 발생했습니다', 'fail');
    } finally {
      setIsGenerating(false);
    }
  }

  async function doRemove() {
    if (!confirmRemove) return;
    const member = confirmRemove;
    setConfirmRemove(null);
    try {
      const res = await fetch(`/api/workspaces/${selectedWsId}/members/${member.id}`, { method: 'DELETE' });
      if (!res.ok) {
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

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 18, fontWeight: 600, color: '#2C3E50', display: 'flex', alignItems: 'baseline', gap: 4 }}>
          멤버 관리
          <span style={{ fontSize: 12, fontWeight: 400, color: '#8993A4' }}>({members.length}명)</span>
        </h2>
        {isOwner && (
          <button
            onClick={() => { setInviteOpen(true); setGeneratedLink(null); generateInviteLink(inviteRole); }}
            style={{ height: 32, padding: '0 14px', borderRadius: 6, fontFamily: "'Noto Sans KR', sans-serif", fontSize: 12, fontWeight: 500, cursor: 'pointer', background: '#629584', color: '#fff', border: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Link2 size={14} />
            초대 링크 생성
          </button>
        )}
      </div>
      <p style={{ fontSize: 12, color: '#8993A4', marginBottom: 20, lineHeight: 1.6 }}>
        {isOwner ? (<>워크스페이스 초대용 링크를 생성해서 전달하세요.<br />브라우저에서 링크를 입력하면 초대 화면으로 이동할 수 있습니다.</>) : '워크스페이스 멤버 목록입니다.'}
      </p>

      {/* Workspace selector */}
      {workspaces.length > 1 && (
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#5A6B7F', marginBottom: 6, display: 'block' }}>
            워크스페이스 선택
          </label>
          <select
            value={selectedWsId}
            onChange={(e) => setSelectedWsId(Number(e.target.value))}
            style={{
              height: 36,
              padding: '0 12px',
              border: '1px solid #DFE1E6',
              borderRadius: 6,
              fontFamily: "'Noto Sans KR', sans-serif",
              fontSize: 12,
              color: '#2C3E50',
              outline: 'none',
              background: '#fff',
              minWidth: 200,
            }}
          >
            {workspaces.map((ws) => (
              <option key={ws.id} value={ws.id}>
                {ws.name} ({ROLE_STYLES[ws.role as MemberRole]?.label ?? ws.role})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Join Requests — OWNER only */}
      {isOwner && joinRequests.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#2C3E50', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            가입 신청
            <span style={{ background: '#629584', color: '#fff', borderRadius: 10, fontSize: 11, fontWeight: 700, padding: '1px 7px' }}>
              {joinRequests.length}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {joinRequests.map((req) => (
              <div key={req.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#F0FDF4', border: '1px solid #A7F3D0', borderRadius: 6 }}>
                <Avatar displayName={req.userName} color="#629584" size="md" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 500 }}>{req.userName}</div>
                  <div style={{ fontSize: 11, color: '#8993A4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{req.userEmail}</div>
                  {req.message && (
                    <div style={{ fontSize: 11, color: '#5A6B7F', marginTop: 2, fontStyle: 'italic' }}>&ldquo;{req.message}&rdquo;</div>
                  )}
                </div>
                <span style={{ fontSize: 11, color: '#8993A4', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {req.createdAt.slice(0, 10)}
                </span>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button
                    onClick={() => handleJoinRequest(req.id, 'APPROVE')}
                    disabled={processingReqId === req.id}
                    style={{ height: 28, padding: '0 12px', borderRadius: 4, fontSize: 11, fontWeight: 600, cursor: processingReqId === req.id ? 'not-allowed' : 'pointer', background: '#629584', color: '#fff', border: 'none', opacity: processingReqId === req.id ? 0.6 : 1 }}
                  >
                    승인
                  </button>
                  <button
                    onClick={() => handleJoinRequest(req.id, 'REJECT')}
                    disabled={processingReqId === req.id}
                    style={{ height: 28, padding: '0 10px', borderRadius: 4, fontSize: 11, fontWeight: 500, cursor: processingReqId === req.id ? 'not-allowed' : 'pointer', background: '#fff', color: '#DC2626', border: '1px solid #FECACA', opacity: processingReqId === req.id ? 0.6 : 1 }}
                  >
                    거절
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite Link Panel — OWNER only */}
      {isOwner && inviteOpen && (
        <div style={{ padding: 14, background: '#F1F3F6', border: '1px dashed #C4C9D1', borderRadius: 8, marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: '#5A6B7F', fontWeight: 500, marginBottom: 6 }}>초대 링크 (24시간 유효)</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <input
              readOnly
              value={isGenerating ? '생성 중...' : (generatedLink ?? '')}
              placeholder="링크 생성 중..."
              style={{ flex: 1, minWidth: 200, height: 30, padding: '0 8px', border: '1px solid #DFE1E6', borderRadius: 4, fontFamily: 'monospace', fontSize: 11, color: '#5A6B7F', background: '#fff', outline: 'none' }}
              onClick={(e) => generatedLink && (e.target as HTMLInputElement).select()}
            />
            <button
              onClick={() => { if (generatedLink) { navigator.clipboard.writeText(generatedLink); showToast('링크가 복사되었습니다', 'success'); } }}
              disabled={!generatedLink || isGenerating}
              style={{ height: 30, padding: '0 12px', borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: (!generatedLink || isGenerating) ? 'not-allowed' : 'pointer', background: '#629584', color: '#fff', border: 'none', flexShrink: 0, opacity: (!generatedLink || isGenerating) ? 0.5 : 1 }}
            >
              복사
            </button>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as 'MEMBER' | 'VIEWER')}
              style={{ height: 30, padding: '0 8px', border: '1px solid #DFE1E6', borderRadius: 4, fontFamily: "'Noto Sans KR', sans-serif", fontSize: 12, color: '#2C3E50', background: '#fff', outline: 'none', cursor: 'pointer' }}
            >
              <option value="MEMBER">멤버</option>
              <option value="VIEWER">뷰어</option>
            </select>
            <button
              onClick={() => generateInviteLink(inviteRole)}
              disabled={isGenerating}
              style={{ height: 30, padding: '0 10px', borderRadius: 6, fontSize: 12, cursor: isGenerating ? 'not-allowed' : 'pointer', background: 'transparent', border: '1px solid #DFE1E6', color: '#5A6B7F', flexShrink: 0, opacity: isGenerating ? 0.5 : 1 }}
            >
              재생성
            </button>
          </div>
        </div>
      )}

      {/* Member List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {members.map((member) => {
          const isAdmin = member.role === 'OWNER';
          const canRemove = !(isAdmin && adminCount <= 1);
          const isSelf = member.userId === currentUserId;

          return (
            <div key={member.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: '#fff', border: '1px solid #DFE1E6', borderRadius: 6 }}>
              <Avatar displayName={member.displayName} color={member.color} size="md" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 500 }}>{member.displayName}</div>
                <div style={{ fontSize: 11, color: '#8993A4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.email}</div>
              </div>
              <RoleBadge role={member.role} size="sm" />
              <span style={{ fontSize: 11, color: '#8993A4', whiteSpace: 'nowrap', flexShrink: 0 }}>
                {member.createdAt.slice(0, 10)}
              </span>
              {isOwner && (
                <div style={{ display: 'flex', gap: 4, flexShrink: 0, alignItems: 'center' }}>
                  {member.role !== 'OWNER' && (
                    <button
                      type="button"
                      onClick={() => setTransferTarget(member)}
                      style={{
                        padding: '4px 10px', fontSize: 11, fontWeight: 600,
                        border: '1.5px solid #DFE1E6', borderRadius: 6,
                        background: '#fff', color: '#5A6B7F', cursor: 'pointer',
                      }}
                    >
                      소유권 이전
                    </button>
                  )}
                  {/* Role select — visible to OWNER, hidden for self */}
                  {!isSelf && (
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member, e.target.value as MemberRole)}
                      title="역할 변경"
                      style={{
                        height: 28, padding: '0 6px', border: '1px solid #DFE1E6',
                        borderRadius: 6, fontSize: 11, fontFamily: 'inherit',
                        color: '#5A6B7F', background: '#fff', cursor: 'pointer', outline: 'none',
                      }}
                    >
                      {Object.values(TEAM_ROLE).map((r) => (
                        <option key={r} value={r}>{ROLE_STYLES[r].label}</option>
                      ))}
                    </select>
                  )}
                  {canRemove && !isSelf && (
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
              )}
            </div>
          );
        })}
        {members.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', fontSize: 12, color: '#8993A4' }}>
            멤버 목록을 불러오는 중...
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmRole !== null}
        title="역할 변경"
        message={`"${confirmRole?.member.displayName}"의 역할을 ${confirmRole ? ROLE_STYLES[confirmRole.newRole].label : ''}(으)로 변경하시겠습니까?`}
        confirmLabel="변경"
        confirmVariant="primary"
        onConfirm={doRoleChange}
        onCancel={() => setConfirmRole(null)}
      />
      <ConfirmDialog
        isOpen={confirmRemove !== null}
        title="멤버 제거"
        message={`"${confirmRemove?.displayName}" (${confirmRemove?.email})을(를) 프로젝트에서 제거하시겠습니까?`}
        confirmLabel="제거"
        onConfirm={doRemove}
        onCancel={() => setConfirmRemove(null)}
      />

      <Modal
        isOpen={transferTarget !== null}
        onClose={() => setTransferTarget(null)}
        title="소유권 이전"
        maxWidth={420}
      >
        <div style={{ padding: '20px 20px 24px' }}>
          <p style={{ fontSize: 13, color: '#5A6B7F', marginBottom: 20 }}>
            <strong style={{ color: '#2C3E50' }}>{transferTarget?.displayName}</strong>님에게 소유권을 이전하시겠습니까?
            이전 후 당신은 일반 멤버가 됩니다.
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setTransferTarget(null)}
              style={{ padding: '9px 20px', border: '1.5px solid #DFE1E6', borderRadius: 8, background: '#fff', fontSize: 13, cursor: 'pointer' }}>
              취소
            </button>
            <button
              type="button"
              onClick={async () => {
                if (!selectedWsId || !transferTarget) return;
                const res = await fetch(`/api/workspaces/${selectedWsId}/transfer`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ targetMemberId: transferTarget.id }),
                });
                if (res.ok) {
                  window.location.reload();
                } else {
                  const data = (await res.json()) as { error?: { message?: string } };
                  showToast(data.error?.message ?? '이전 실패', 'fail');
                }
                setTransferTarget(null);
              }}
              style={{ padding: '9px 20px', border: 'none', borderRadius: 8, background: '#629584', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              이전 확인
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
