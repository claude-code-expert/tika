'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import type { InAppNotification, WorkspaceWithRole } from '@/types/index';

type ReadFilter = 'all' | 'unread' | 'read';

const PAGE_SIZE = 10;

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const TYPE_LABELS: Record<string, string> = {
  TICKET_STATUS_CHANGED: '상태 변경',
  TICKET_COMMENTED: '댓글',
  TICKET_ASSIGNED: '배정',
  TICKET_UNASSIGNED: '배정 해제',
  TICKET_DELETED: '티켓 삭제',
  DEADLINE_WARNING: '마감 임박',
  INVITE_RECEIVED: '초대',
  ROLE_CHANGED: '역할 변경',
  MEMBER_JOINED: '멤버 참여',
  MEMBER_REMOVED: '멤버 제거',
  JOIN_REQUEST_RECEIVED: '참여 신청',
  JOIN_REQUEST_RESOLVED: '신청 결과',
  SPRINT_STARTED: '스프린트 시작',
  SPRINT_COMPLETED: '스프린트 완료',
};

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  TICKET_STATUS_CHANGED: { bg: '#DBEAFE', color: '#2563EB' },
  TICKET_COMMENTED: { bg: '#E0E7FF', color: '#4338CA' },
  TICKET_ASSIGNED: { bg: '#D1FAE5', color: '#059669' },
  TICKET_UNASSIGNED: { bg: '#FEE2E2', color: '#DC2626' },
  TICKET_DELETED: { bg: '#FEE2E2', color: '#DC2626' },
  DEADLINE_WARNING: { bg: '#FEF3C7', color: '#B45309' },
  INVITE_RECEIVED: { bg: '#F3E8FF', color: '#7C3AED' },
  ROLE_CHANGED: { bg: '#FCE7F3', color: '#DB2777' },
  MEMBER_JOINED: { bg: '#D1FAE5', color: '#059669' },
  MEMBER_REMOVED: { bg: '#FEE2E2', color: '#DC2626' },
  JOIN_REQUEST_RECEIVED: { bg: '#F3E8FF', color: '#7C3AED' },
  JOIN_REQUEST_RESOLVED: { bg: '#E0E7FF', color: '#4338CA' },
  SPRINT_STARTED: { bg: '#DBEAFE', color: '#2563EB' },
  SPRINT_COMPLETED: { bg: '#D1FAE5', color: '#059669' },
};

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [readFilter, setReadFilter] = useState<ReadFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isMarkingRead, setIsMarkingRead] = useState(false);
  const [workspaces, setWorkspaces] = useState<{ id: number; name: string }[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<number | null>(null);
  const router = useRouter();

  // Fetch workspaces for filter dropdown
  useEffect(() => {
    fetch('/api/workspaces')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { workspaces?: WorkspaceWithRole[] } | null) => {
        if (data?.workspaces) {
          setWorkspaces(data.workspaces.map((w) => ({ id: w.id, name: w.name })));
        }
      })
      .catch(() => {});
  }, []);

  // Fetch notifications (re-fetch when workspace filter changes)
  useEffect(() => {
    setIsLoading(true);
    const params = new URLSearchParams({ limit: '200' });
    if (selectedWorkspaceId !== null) params.set('workspaceId', String(selectedWorkspaceId));
    fetch(`/api/notifications/in-app?${params}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { notifications?: InAppNotification[] } | null) => {
        if (data?.notifications) setNotifications(data.notifications);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [selectedWorkspaceId]);

  // Filtered list
  const filtered = notifications.filter((n) => {
    if (readFilter === 'unread' && n.isRead) return false;
    if (readFilter === 'read' && !n.isRead) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Mark single as read + navigate
  const handleItemClick = useCallback((notif: InAppNotification) => {
    if (!notif.isRead) {
      fetch(`/api/notifications/in-app/${notif.id}/read`, { method: 'PATCH' })
        .then(() => {
          setNotifications((prev) =>
            prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n)),
          );
        })
        .catch(() => {});
    }
    if (notif.link) {
      router.push(notif.link);
    }
  }, [router]);

  // Mark all as read
  const handleMarkAllRead = useCallback(async () => {
    if (isMarkingRead) return;
    setIsMarkingRead(true);
    try {
      const res = await fetch('/api/notifications/in-app/read-all', { method: 'PATCH' });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }
    } finally {
      setIsMarkingRead(false);
    }
  }, [isMarkingRead]);

  // Reset page when filter changes
  const applyReadFilter = (f: ReadFilter) => {
    setReadFilter(f);
    setCurrentPage(1);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        background: 'var(--color-app-bg)',
        fontFamily: "'Noto Sans KR', 'Plus Jakarta Sans', sans-serif",
      }}
    >
      <Header />

      {/* ─── Main content ─── */}
      <main
        style={{
          flex: 1,
          maxWidth: 860,
          width: '100%',
          margin: '0 auto',
          padding: '32px 24px',
        }}
      >
        {/* Page title */}
        <h1
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 22,
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            marginBottom: 4,
          }}
        >
          알림 내역
        </h1>
        <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 20 }}>
          알림을 확인하고 관련 항목으로 이동할 수 있습니다.
        </p>

        {/* ─── Filter bar ─── */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            marginBottom: 20,
            alignItems: 'center',
          }}
        >
          {/* Read/Unread filter */}
          <div style={{ display: 'flex', gap: 4 }}>
            {([
              { value: 'all', label: '전체', count: notifications.length },
              { value: 'unread', label: '미읽음', count: unreadCount },
              { value: 'read', label: '읽음', count: notifications.length - unreadCount },
            ] as { value: ReadFilter; label: string; count: number }[]).map(({ value, label, count }) => (
              <button
                key={value}
                className="chip"
                data-active={readFilter === value ? 'true' : undefined}
                onClick={() => applyReadFilter(value)}
              >
                {label}
                <span className="chip-count">{count}</span>
              </button>
            ))}
          </div>

          {/* Workspace filter */}
          {workspaces.length > 1 && (
            <select
              value={selectedWorkspaceId ?? ''}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedWorkspaceId(val === '' ? null : Number(val));
                setCurrentPage(1);
              }}
              style={{
                height: 30,
                padding: '0 8px',
                border: '1px solid var(--color-border)',
                borderRadius: 20,
                fontSize: 12,
                color: 'var(--color-text-secondary)',
                background: '#fff',
                cursor: 'pointer',
                fontFamily: 'inherit',
                outline: 'none',
              }}
            >
              <option value="">전체 워크스페이스</option>
              {workspaces.map((ws) => (
                <option key={ws.id} value={ws.id}>
                  {ws.name}
                </option>
              ))}
            </select>
          )}

          {/* Mark all read */}
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={isMarkingRead}
              style={{
                marginLeft: 'auto',
                height: 30,
                padding: '0 12px',
                background: 'none',
                border: '1px solid var(--color-border)',
                borderRadius: 20,
                fontSize: 12,
                color: 'var(--color-accent)',
                cursor: 'pointer',
                fontFamily: 'inherit',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s',
              }}
            >
              {isMarkingRead ? '처리 중...' : `모두 읽음 (${unreadCount})`}
            </button>
          )}
        </div>

        {/* ─── Notification list ─── */}
        {isLoading ? (
          <div
            style={{
              textAlign: 'center',
              padding: '48px 16px',
              color: 'var(--color-text-muted)',
              fontSize: 13,
            }}
          >
            불러오는 중...
          </div>
        ) : pageItems.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '48px 16px',
              color: 'var(--color-text-muted)',
              fontSize: 13,
            }}
          >
            해당 조건의 알림이 없습니다.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {pageItems.map((notif) => (
              <NotifItem key={notif.id} notif={notif} onRead={handleItemClick} />
            ))}
          </div>
        )}

        {/* ─── Pagination ─── */}
        {totalPages > 1 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              marginTop: 24,
            }}
          >
            <PageBtn
              disabled={safePage <= 1}
              onClick={() => setCurrentPage(safePage - 1)}
              label="◀"
            />
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
              const show =
                p <= 2 ||
                p >= totalPages - 1 ||
                Math.abs(p - safePage) <= 1;
              if (!show) {
                if (p === 3 || p === totalPages - 2) {
                  return (
                    <span key={p} style={{ fontSize: 12, color: 'var(--color-text-muted)', padding: '0 4px' }}>
                      …
                    </span>
                  );
                }
                return null;
              }
              return (
                <PageBtn
                  key={p}
                  active={p === safePage}
                  onClick={() => setCurrentPage(p)}
                  label={String(p)}
                />
              );
            })}
            <PageBtn
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage(safePage + 1)}
              label="▶"
            />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

/* ─── Sub-components ─── */

function NotifItem({
  notif,
  onRead,
}: {
  notif: InAppNotification;
  onRead: (notif: InAppNotification) => void;
}) {
  const typeStyle = TYPE_COLORS[notif.type] ?? { bg: '#F1F3F6', color: '#5A6B7F' };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onRead(notif)}
      onKeyDown={(e) => e.key === 'Enter' && onRead(notif)}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '14px 16px',
        background: notif.isRead ? '#fff' : '#F0FDF4',
        border: '1px solid var(--color-border)',
        borderRadius: 8,
        cursor: notif.link ? 'pointer' : 'default',
        transition: 'all 0.15s',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,.06)';
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border-hover)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)';
      }}
      aria-label={`알림: ${notif.title}`}
    >
      {/* Unread dot */}
      {!notif.isRead && (
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: 'var(--color-accent)',
            flexShrink: 0,
            marginTop: 5,
          }}
        />
      )}

      {/* Body */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Top row: type badge + title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              height: 20,
              padding: '0 7px',
              borderRadius: 4,
              fontSize: 10,
              fontWeight: 600,
              background: typeStyle.bg,
              color: typeStyle.color,
              flexShrink: 0,
            }}
          >
            {TYPE_LABELS[notif.type] ?? notif.type}
          </span>
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {notif.title}
          </span>
        </div>

        {/* Message */}
        <div
          style={{
            fontSize: 13,
            color: 'var(--color-text-secondary)',
            lineHeight: 1.5,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            marginBottom: 4,
          }}
        >
          {notif.message}
        </div>

        {/* Meta row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{timeAgo(notif.createdAt)}</span>
          <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>·</span>
          <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{formatDate(notif.createdAt)}</span>
          {notif.actorName && (
            <>
              <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>·</span>
              <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{notif.actorName}</span>
            </>
          )}
        </div>
      </div>

      {/* Read chip */}
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          height: 20,
          padding: '0 8px',
          borderRadius: 10,
          fontSize: 10,
          fontWeight: 600,
          flexShrink: 0,
          whiteSpace: 'nowrap',
          marginTop: 2,
          background: notif.isRead ? 'var(--color-sidebar-bg)' : '#FEF3C7',
          color: notif.isRead ? 'var(--color-text-muted)' : '#B45309',
        }}
      >
        {notif.isRead ? '확인' : '미확인'}
      </span>
    </div>
  );
}

function PageBtn({
  label,
  active,
  disabled,
  onClick,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 32,
        height: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-button)',
        background: active ? 'var(--color-accent)' : '#fff',
        color: active ? '#fff' : 'var(--color-text-secondary)',
        fontSize: 12,
        fontFamily: 'inherit',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'all 0.15s',
        pointerEvents: disabled ? 'none' : 'auto',
      }}
      onMouseEnter={(e) => {
        if (!active && !disabled) {
          (e.currentTarget as HTMLElement).style.background = 'var(--color-sidebar-bg)';
          (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border-hover)';
        }
      }}
      onMouseLeave={(e) => {
        if (!active && !disabled) {
          (e.currentTarget as HTMLElement).style.background = '#fff';
          (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)';
        }
      }}
    >
      {label}
    </button>
  );
}
