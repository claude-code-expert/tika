'use client';

import { useState, useEffect, useCallback } from 'react';
import type { SectionProps } from './types';
import type { WorkspaceWithRole, NotificationType } from '@/types/index';
import { NOTIFICATION_TYPE } from '@/types/index';

interface TypeToggle {
  type: NotificationType;
  label: string;
  description: string;
  enabled: boolean;
}

const CATEGORY_CONFIG: {
  category: string;
  types: { type: NotificationType; label: string; description: string }[];
}[] = [
  {
    category: '티켓',
    types: [
      { type: NOTIFICATION_TYPE.TICKET_STATUS_CHANGED, label: '상태 변경', description: '배정된 티켓의 상태가 변경되었을 때' },
      { type: NOTIFICATION_TYPE.TICKET_COMMENTED, label: '새 댓글', description: '배정된 티켓에 새 댓글이 달렸을 때' },
      { type: NOTIFICATION_TYPE.TICKET_ASSIGNED, label: '티켓 배정', description: '나에게 티켓이 배정되었을 때' },
      { type: NOTIFICATION_TYPE.TICKET_UNASSIGNED, label: '배정 해제', description: '나에게 배정된 티켓이 해제되었을 때' },
      { type: NOTIFICATION_TYPE.TICKET_DELETED, label: '티켓 삭제', description: '배정된 티켓이 삭제되었을 때' },
    ],
  },
  {
    category: '마감일',
    types: [
      { type: NOTIFICATION_TYPE.DEADLINE_WARNING, label: '마감일 임박', description: '배정된 티켓의 마감일이 내일일 때 (D-1)' },
    ],
  },
  {
    category: '워크스페이스',
    types: [
      { type: NOTIFICATION_TYPE.INVITE_RECEIVED, label: '초대', description: '워크스페이스에 초대되었을 때' },
      { type: NOTIFICATION_TYPE.ROLE_CHANGED, label: '역할 변경', description: '워크스페이스에서 내 역할이 변경되었을 때' },
      { type: NOTIFICATION_TYPE.MEMBER_JOINED, label: '멤버 참여', description: '새 멤버가 워크스페이스에 참여했을 때' },
      { type: NOTIFICATION_TYPE.MEMBER_REMOVED, label: '멤버 나가기', description: '워크스페이스에서 멤버가 나갔을 때' },
      { type: NOTIFICATION_TYPE.JOIN_REQUEST_RECEIVED, label: '참여 신청', description: '워크스페이스에 참여 신청이 접수되었을 때' },
      { type: NOTIFICATION_TYPE.JOIN_REQUEST_RESOLVED, label: '승인 완료', description: '참여 신청이 승인 완료되었을 때' },
    ],
  },
];

export function NotificationPreferencesSection({ showToast, workspaceId }: SectionProps) {
  const [workspaces, setWorkspaces] = useState<WorkspaceWithRole[]>([]);
  const [selectedWsId, setSelectedWsId] = useState<number>(workspaceId);
  const [toggles, setToggles] = useState<TypeToggle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingType, setUpdatingType] = useState<string | null>(null);

  // Fetch all workspaces for the workspace selector dropdown
  useEffect(() => {
    fetch('/api/workspaces')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { workspaces?: WorkspaceWithRole[] } | null) => {
        setWorkspaces(data?.workspaces ?? []);
      })
      .catch(() => {});
  }, []);

  // Fetch preferences when workspace changes
  useEffect(() => {
    
    setIsLoading(true);
    fetch(`/api/notifications/preferences?workspaceId=${selectedWsId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { preferences?: Record<string, boolean> } | null) => {
        const prefs = data?.preferences ?? {};
        // Build toggle list from CATEGORY_CONFIG, defaulting to enabled if no preference set
        const allToggles: TypeToggle[] = CATEGORY_CONFIG.flatMap((cat) =>
          cat.types.map((t) => ({
            ...t,
            enabled: prefs[t.type] !== undefined ? prefs[t.type] : true,
          })),
        );
        setToggles(allToggles);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [selectedWsId]);

  const handleToggle = useCallback(
    async (type: NotificationType, currentEnabled: boolean) => {
      if (updatingType) return;
      const newEnabled = !currentEnabled;
      setUpdatingType(type);

      // Optimistic update
      setToggles((prev) =>
        prev.map((t) => (t.type === type ? { ...t, enabled: newEnabled } : t)),
      );

      try {
        const res = await fetch('/api/notifications/preferences', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workspaceId: selectedWsId,
            type,
            inAppEnabled: newEnabled,
          }),
        });
        if (!res.ok) {
          throw new Error('Failed');
        }
      } catch {
        // Rollback
        setToggles((prev) =>
          prev.map((t) => (t.type === type ? { ...t, enabled: currentEnabled } : t)),
        );
        showToast('설정 저장에 실패했습니다', 'fail');
      } finally {
        setUpdatingType(null);
      }
    },
    [selectedWsId, updatingType, showToast],
  );

  if (workspaces.length === 0 && !isLoading) {
    return (
      <div style={{ padding: '24px 0', color: 'var(--color-text-muted)', fontSize: 13 }}>
        워크스페이스가 없습니다. 워크스페이스를 생성한 후 알림 설정을 관리할 수 있습니다.
      </div>
    );
  }

  return (
    <div>
      <h2
        style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: 18,
          fontWeight: 700,
          color: '#2C3E50',
          marginBottom: 4,
        }}
      >
        알림 설정
      </h2>
      <p style={{ fontSize: 12, color: '#8993A4', marginBottom: 20 }}>
        워크스페이스별로 수신할 알림 유형을 설정합니다. 비활성화한 알림은 수신되지 않습니다.
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
                {ws.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {isLoading ? (
        <div style={{ padding: '24px 0', color: 'var(--color-text-muted)', fontSize: 13, textAlign: 'center' }}>
          불러오는 중...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {CATEGORY_CONFIG.map((cat) => (
            <div key={cat.category}>
              {/* Category header */}
              <h3
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#2C3E50',
                  marginBottom: 12,
                  paddingBottom: 8,
                  borderBottom: '1px solid #DFE1E6',
                }}
              >
                {cat.category}
              </h3>

              {/* Toggle rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {cat.types.map((catType) => {
                  const toggle = toggles.find((t) => t.type === catType.type);
                  if (!toggle) return null;
                  const isUpdating = updatingType === toggle.type;

                  return (
                    <div
                      key={toggle.type}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: 6,
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = '#F8F9FB';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = 'transparent';
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#2C3E50', marginBottom: 2 }}>
                          {toggle.label}
                        </div>
                        <div style={{ fontSize: 11, color: '#8993A4' }}>
                          {toggle.description}
                        </div>
                      </div>

                      {/* Toggle switch */}
                      <button
                        onClick={() => handleToggle(toggle.type, toggle.enabled)}
                        disabled={isUpdating}
                        aria-label={`${toggle.label} 알림 ${toggle.enabled ? '끄기' : '켜기'}`}
                        style={{
                          width: 40,
                          height: 22,
                          borderRadius: 11,
                          border: 'none',
                          cursor: isUpdating ? 'default' : 'pointer',
                          background: toggle.enabled ? '#629584' : '#D1D5DB',
                          position: 'relative',
                          transition: 'background 0.2s',
                          flexShrink: 0,
                          marginLeft: 16,
                          opacity: isUpdating ? 0.5 : 1,
                        }}
                      >
                        <span
                          style={{
                            position: 'absolute',
                            top: 2,
                            left: toggle.enabled ? 20 : 2,
                            width: 18,
                            height: 18,
                            borderRadius: '50%',
                            background: '#fff',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                            transition: 'left 0.2s',
                          }}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
