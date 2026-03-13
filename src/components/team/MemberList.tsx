'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { RoleBadge } from '@/components/ui/RoleBadge';
import type { Member, TeamRole } from '@/types/index';

interface MemberListProps {
  members: Member[];
  currentMemberId: number;
  isOwner: boolean;
  workspaceName: string;
  workspaceId: number;
}

export function MemberList({ members, currentMemberId, isOwner, workspaceName, workspaceId }: MemberListProps) {
  const router = useRouter();
  const [deletingMember, setDeletingMember] = useState<Member | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

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
                  onClick={() => setShowLeaveDialog(true)}
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

      <ConfirmDialog
        isOpen={deletingMember !== null}
        message={`${deletingMember?.displayName ?? '멤버'}를 "${workspaceName}"에서 삭제하시겠습니까?`}
        confirmLabel={isDeleting ? '삭제 중...' : '삭제'}
        confirmVariant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeletingMember(null)}
      />

      <ConfirmDialog
        isOpen={showLeaveDialog}
        message={`"${workspaceName}" 워크스페이스에서 나가시겠습니까?`}
        confirmLabel={isLeaving ? '나가는 중...' : '나가기'}
        confirmVariant="danger"
        onConfirm={async () => {
          setIsLeaving(true);
          const res = await fetch(`/api/workspaces/${workspaceId}/members/me`, { method: 'DELETE' });
          if (res.ok) {
            window.location.href = '/';
          } else {
            setIsLeaving(false);
            setShowLeaveDialog(false);
          }
        }}
        onCancel={() => setShowLeaveDialog(false)}
      />
    </>
  );
}
