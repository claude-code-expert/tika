'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { RoleBadge } from '@/components/ui/RoleBadge';
import type { Member, TeamRole, WorkspaceInvite } from '@/types/index';

interface MemberListProps {
  members: Member[];
  currentMemberId: number;
  isOwner: boolean;
  workspaceName: string;
  workspaceId: number;
  pendingInvites?: WorkspaceInvite[];
}

export function MemberList({ members, currentMemberId, isOwner, workspaceName, workspaceId, pendingInvites = [] }: MemberListProps) {
  const router = useRouter();
  const [deletingMember, setDeletingMember] = useState<Member | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingInvite, setDeletingInvite] = useState<WorkspaceInvite | null>(null);
  const [isDeletingInvite, setIsDeletingInvite] = useState(false);

  const handleDelete = async () => {
    if (!deletingMember) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/members/${deletingMember.id}`, { method: 'DELETE' });
      if (res.ok) {
        router.refresh();
      } else {
        const data = (await res.json()) as { error?: { message?: string } };
        alert(data.error?.message ?? '삭제에 실패했습니다');
      }
    } finally {
      setIsDeleting(false);
      setDeletingMember(null);
    }
  };

  const handleDeleteInvite = async () => {
    if (!deletingInvite) return;
    setIsDeletingInvite(true);
    try {
      const res = await fetch(`/api/workspaces/${deletingInvite.workspaceId}/invites/${deletingInvite.id}`, { method: 'DELETE' });
      if (res.ok) {
        router.refresh();
      } else {
        const data = (await res.json()) as { error?: { message?: string } };
        alert(data.error?.message ?? '삭제에 실패했습니다');
      }
    } finally {
      setIsDeletingInvite(false);
      setDeletingInvite(null);
    }
  };

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {members.map((m) => {
          const isSelf = m.id === currentMemberId;
          const canDelete = isOwner && !isSelf;
          return (
            <div
              key={m.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 10px',
                borderRadius: 7,
                background: '#F9FAFB',
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: m.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#fff',
                  flexShrink: 0,
                }}
              >
                {m.displayName.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>
                  {m.displayName}
                  {isSelf && (
                    <span style={{ fontSize: 10, color: '#9CA3AF', marginLeft: 6, fontWeight: 400 }}>(나)</span>
                  )}
                </div>
                {m.joinedAt && (
                  <div style={{ fontSize: 10, color: '#9CA3AF' }}>
                    {new Date(m.joinedAt).toLocaleDateString('ko-KR')} 가입
                  </div>
                )}
              </div>
              <RoleBadge role={m.role as TeamRole} size="sm" />
              {isSelf && m.role !== 'OWNER' && (
                <button
                  type="button"
                  onClick={async () => {
                    if (!confirm('이 워크스페이스에서 나가시겠습니까?')) return;
                    const res = await fetch(`/api/workspaces/${workspaceId}/members/me`, { method: 'DELETE' });
                    if (res.ok) {
                      window.location.href = '/';
                    }
                  }}
                  style={{
                    padding: '5px 12px', fontSize: 12, fontWeight: 600,
                    border: '1.5px solid #DFE1E6', borderRadius: 6,
                    background: '#fff', color: '#5A6B7F', cursor: 'pointer',
                  }}
                >
                  나가기
                </button>
              )}
              {canDelete && (
                <button
                  onClick={() => setDeletingMember(m)}
                  style={{
                    marginLeft: 4,
                    padding: '3px 8px',
                    fontSize: 11,
                    fontWeight: 500,
                    color: '#DC2626',
                    background: 'transparent',
                    border: '1px solid #FECACA',
                    borderRadius: 5,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    flexShrink: 0,
                  }}
                >
                  삭제
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Pending invites section */}
      {pendingInvites.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
            초대 대기중 ({pendingInvites.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {pendingInvites.map((inv) => (
              <div
                key={inv.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 10px',
                  borderRadius: 7,
                  background: '#FEFCE8',
                  border: '1px solid #FEF08A',
                }}
              >
                {/* Avatar placeholder */}
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: '#E5E7EB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#9CA3AF',
                    flexShrink: 0,
                  }}
                >
                  ?
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {inv.email}
                  </div>
                  <div style={{ fontSize: 10, color: '#9CA3AF' }}>
                    만료: {new Date(inv.expiresAt).toLocaleDateString('ko-KR')}
                  </div>
                </div>
                {/* Role badge */}
                <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 999, background: '#EDE9FE', color: '#7C3AED', whiteSpace: 'nowrap' }}>
                  {inv.role === 'MEMBER' ? 'Member' : 'Viewer'}
                </span>
                {/* Status badge */}
                <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 999, background: '#FEF3C7', color: '#D97706', whiteSpace: 'nowrap' }}>
                  대기중
                </span>
                {/* Delete button */}
                <button
                  onClick={() => setDeletingInvite(inv)}
                  style={{
                    marginLeft: 4,
                    padding: '3px 8px',
                    fontSize: 11,
                    fontWeight: 500,
                    color: '#DC2626',
                    background: 'transparent',
                    border: '1px solid #FECACA',
                    borderRadius: 5,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    flexShrink: 0,
                  }}
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={deletingMember !== null}
        message={`${deletingMember?.displayName ?? '멤버'}를 "${workspaceName}"에서 삭제하시겠습니까?`}
        confirmLabel={isDeleting ? '삭제 중...' : '삭제'}
        confirmVariant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeletingMember(null)}
      />

      <ConfirmDialog
        isOpen={deletingInvite !== null}
        message={`${deletingInvite?.email ?? ''}의 초대를 삭제하시겠습니까?`}
        confirmLabel={isDeletingInvite ? '삭제 중...' : '삭제'}
        confirmVariant="danger"
        onConfirm={handleDeleteInvite}
        onCancel={() => setDeletingInvite(null)}
      />
    </>
  );
}
