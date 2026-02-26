'use client';

import { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import type { NotificationLog } from '@/types/index';

type ChannelFilter = 'all' | 'slack' | 'telegram';
type StatusFilter = 'all' | 'SENT' | 'FAILED';

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

export function NotificationsPage() {
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isMarkingRead, setIsMarkingRead] = useState(false);

  // Fetch all logs on mount
  useEffect(() => {
    setIsLoading(true);
    fetch('/api/notifications/logs?limit=200')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { logs?: NotificationLog[] } | null) => {
        if (data?.logs) setLogs(data.logs);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  // Filtered list
  const filtered = logs.filter((log) => {
    if (channelFilter !== 'all' && log.channel !== channelFilter) return false;
    if (statusFilter !== 'all' && log.status !== statusFilter) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Count per filter chip
  const slackCount = logs.filter((l) => l.channel === 'slack').length;
  const telegramCount = logs.filter((l) => l.channel === 'telegram').length;

  // Click on item → mark as read (local)
  const handleItemClick = useCallback((id: number) => {
    setLogs((prev) =>
      prev.map((l) => (l.id === id ? { ...l, isRead: true } : l)),
    );
  }, []);

  // Mark all as read
  const handleMarkAllRead = useCallback(async () => {
    if (isMarkingRead) return;
    setIsMarkingRead(true);
    try {
      const res = await fetch('/api/notifications/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markAllRead' }),
      });
      if (res.ok) {
        setLogs((prev) => prev.map((l) => ({ ...l, isRead: true })));
      }
    } finally {
      setIsMarkingRead(false);
    }
  }, [isMarkingRead]);

  // Reset page when filter changes
  const applyChannelFilter = (f: ChannelFilter) => {
    setChannelFilter(f);
    setCurrentPage(1);
  };
  const applyStatusFilter = (f: StatusFilter) => {
    setStatusFilter(f);
    setCurrentPage(1);
  };

  const unreadCount = logs.filter((l) => !l.isRead).length;

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
          발송된 알림의 이력을 확인하고 관련 티켓으로 이동할 수 있습니다.
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
          {/* Channel filter */}
          <div style={{ display: 'flex', gap: 4 }}>
            {([
              { value: 'all', label: '전체', count: logs.length },
              { value: 'slack', label: 'Slack', count: slackCount },
              { value: 'telegram', label: 'Telegram', count: telegramCount },
            ] as { value: ChannelFilter; label: string; count: number }[]).map(({ value, label, count }) => (
              <button
                key={value}
                className="chip"
                data-active={channelFilter === value ? 'true' : undefined}
                onClick={() => applyChannelFilter(value)}
              >
                {label}
                <span className="chip-count">{count}</span>
              </button>
            ))}
          </div>

          {/* Divider */}
          <div
            style={{
              width: 1,
              height: 20,
              background: 'var(--color-border)',
              margin: '0 6px',
              flexShrink: 0,
            }}
          />

          {/* Status filter */}
          <div style={{ display: 'flex', gap: 4 }}>
            {([
              { value: 'all', label: '전체' },
              { value: 'SENT', label: '성공' },
              { value: 'FAILED', label: '실패' },
            ] as { value: StatusFilter; label: string }[]).map(({ value, label }) => (
              <button
                key={value}
                className="chip"
                data-active={statusFilter === value ? 'true' : undefined}
                onClick={() => applyStatusFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>

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
            <div style={{ fontSize: 36, marginBottom: 8, opacity: 0.5 }}>🔔</div>
            해당 조건의 알림이 없습니다.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {pageItems.map((log) => (
              <NotifItem key={log.id} log={log} onRead={handleItemClick} />
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
              // Show: first 2, last 2, current ±1, with ellipsis
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
  log,
  onRead,
}: {
  log: NotificationLog;
  onRead: (id: number) => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onRead(log.id)}
      onKeyDown={(e) => e.key === 'Enter' && onRead(log.id)}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '14px 16px',
        background: log.status === 'FAILED' ? '#FEF2F2' : '#fff',
        border: '1px solid var(--color-border)',
        borderRadius: 8,
        cursor: 'pointer',
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
      aria-label={`알림: ${log.message.split('\n')[0]}`}
    >
      {/* Status dot */}
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: log.status === 'SENT' ? '#22C55E' : '#EF4444',
          flexShrink: 0,
          marginTop: 4,
        }}
      />

      {/* Body */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Top row: channel badge + message title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
          <ChannelBadge channel={log.channel} />
          <span
            style={{
              fontSize: 14,
              color: 'var(--color-text-primary)',
              lineHeight: 1.4,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: 480,
            }}
          >
            {log.message.split('\n')[0]}
          </span>
        </div>

        {/* Meta row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
          <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{timeAgo(log.sentAt)}</span>
          <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>·</span>
          <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{formatDate(log.sentAt)}</span>
          <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>·</span>
          <span
            style={{
              fontSize: 11,
              color: log.status === 'SENT' ? '#16A34A' : 'var(--color-text-muted)',
              fontWeight: log.status === 'SENT' ? 600 : 400,
            }}
          >
            {log.status === 'SENT' ? '발송 성공' : '발송 실패'}
          </span>
        </div>

        {/* Error message */}
        {log.status === 'FAILED' && log.errorMessage && (
          <div
            style={{
              fontSize: 11,
              color: '#DC2626',
              marginTop: 6,
              padding: '4px 8px',
              background: '#FEE2E2',
              borderRadius: 4,
              display: 'inline-block',
            }}
          >
            ⚠ {log.errorMessage}
          </div>
        )}
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
          background: log.isRead ? 'var(--color-sidebar-bg)' : '#FEF3C7',
          color: log.isRead ? 'var(--color-text-muted)' : '#B45309',
        }}
      >
        {log.isRead ? '확인' : '미확인'}
      </span>
    </div>
  );
}

function ChannelBadge({ channel }: { channel: string }) {
  const isSlack = channel === 'slack';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        height: 20,
        padding: '0 7px',
        borderRadius: 4,
        fontSize: 10,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.3px',
        background: isSlack ? '#F3E8FF' : '#DBEAFE',
        color: isSlack ? '#7C3AED' : '#2563EB',
        flexShrink: 0,
      }}
    >
      {isSlack ? 'Slack' : 'Telegram'}
    </span>
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
