'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { ProfileModal } from './ProfileModal';
import type { Member, NotificationLog } from '@/types/index';

interface HeaderProps {
  onNewTask: () => void;
  searchQuery?: string;
  onSearch?: (q: string) => void;
  onToggleSidebar?: () => void;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

export function Header({ onNewTask, searchQuery = '', onSearch, onToggleSidebar }: HeaderProps) {
  const { data: session } = useSession();
  const user = session?.user;
  const memberId = (user as Record<string, unknown> | undefined)?.memberId as number | undefined;

  const [member, setMember] = useState<Member | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Notification state
  const [notifLogs, setNotifLogs] = useState<NotificationLog[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const displayName = member?.displayName ?? user?.name ?? '사용자';
  const avatarColor = member?.color ?? '#629584';
  const initial = displayName.slice(0, 2).toUpperCase();

  // Mobile detection
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Fetch member data
  useEffect(() => {
    if (!user) return;
    fetch('/api/members')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.members?.length) {
          setMember(data.members[0]);
        }
      })
      .catch(() => {});
  }, [user]);

  // Fetch notification logs on mount
  useEffect(() => {
    if (!user) return;
    fetch('/api/notifications/logs')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { logs?: NotificationLog[]; unreadCount?: number } | null) => {
        if (data) {
          setNotifLogs(data.logs ?? []);
          setUnreadCount(data.unreadCount ?? 0);
        }
      })
      .catch(() => {});
  }, [user]);

  // Close notif dropdown on outside click → mark as read
  useEffect(() => {
    if (!isNotifOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
        if (unreadCount > 0) {
          fetch('/api/notifications/logs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'markAllRead' }),
          })
            .then(() => {
              setUnreadCount(0);
              setNotifLogs((prev) => prev.map((l) => ({ ...l, isRead: true })));
            })
            .catch(() => {});
        }
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isNotifOpen, unreadCount]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!isDropdownOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isDropdownOpen]);

  // Close dropdown on ESC
  useEffect(() => {
    if (!isDropdownOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsDropdownOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isDropdownOpen]);

  const handleProfileSaved = useCallback(
    (data: { displayName: string; color: string }) => {
      setMember((prev) => (prev ? { ...prev, ...data } : prev));
    },
    [],
  );

  return (
    <>
      <style>{`
        .header-dropdown-item:hover {
          background: var(--color-sidebar-bg) !important;
        }
      `}</style>

      <header
        style={{
          height: 'var(--header-height)',
          background: 'var(--color-header-bg)',
          borderBottom: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-header)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          zIndex: 50,
          flexShrink: 0,
          position: 'relative',
        }}
      >
        {/* Left: Hamburger (mobile) + Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {/* Mobile hamburger */}
          {isMobile && (
            <button
              onClick={onToggleSidebar}
              aria-label="사이드바 열기"
              style={{
                width: 44,
                height: 44,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-text-secondary)',
                borderRadius: 6,
                flexShrink: 0,
              }}
            >
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                <line x1={3} y1={6} x2={21} y2={6} />
                <line x1={3} y1={12} x2={21} y2={12} />
                <line x1={3} y1={18} x2={21} y2={18} />
              </svg>
            </button>
          )}
          <Link
            href="/"
            style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}
          >
            <div
              style={{
                width: 50,
                height: 32,
                background: 'var(--color-accent)',
                borderRadius: 7,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 700,
                fontSize: 13,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                flexShrink: 0,
              }}
            >
              Tika
            </div>
            {!isMobile && (
              <span
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontWeight: 700,
                  fontSize: 15,
                  color: 'var(--color-text-primary)',
                }}
              >
                Tickets in. Results out.
              </span>
            )}
          </Link>
        </div>

        {/* Center: Search */}
        <div style={{ flex: 1, maxWidth: 400, margin: '0 auto' }}>
          <div style={{ position: 'relative' }}>
            <svg
              style={{
                position: 'absolute',
                left: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-text-muted)',
                width: 14,
                height: 14,
                pointerEvents: 'none',
              }}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx={11} cy={11} r={8} />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="search"
              placeholder="업무 검색..."
              value={searchQuery}
              onChange={(e) => onSearch?.(e.target.value)}
              style={{
                width: '100%',
                height: 34,
                padding: searchQuery ? '0 30px 0 34px' : '0 14px 0 34px',
                background: 'var(--color-board-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-button)',
                fontSize: 13,
                fontFamily: 'inherit',
                color: 'var(--color-text-primary)',
                outline: 'none',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => onSearch?.('')}
                aria-label="검색 초기화"
                style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-muted)',
                  fontSize: 14,
                  lineHeight: 1,
                  padding: 2,
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <button
            onClick={onNewTask}
            aria-label="새 업무 생성"
            style={{
              height: isMobile ? 44 : 32,
              width: isMobile ? 44 : undefined,
              padding: isMobile ? '0' : '0 14px',
              background: 'var(--color-accent)',
              color: '#fff',
              border: 'none',
              borderRadius: isMobile ? '50%' : 'var(--radius-button)',
              fontSize: isMobile ? 20 : 13,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'background 0.15s',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.background = 'var(--color-accent-hover)')
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.background = 'var(--color-accent)')
            }
          >
            {isMobile ? '+' : '+ 새 업무'}
          </button>

          {/* Notification button + dropdown */}
          <div ref={notifRef} style={{ position: 'relative' }}>
            <button
              aria-label="알림"
              onClick={() => setIsNotifOpen((prev) => !prev)}
              style={{
                width: 32,
                height: 32,
                border: 'none',
                background: 'transparent',
                borderRadius: 'var(--radius-button)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-text-secondary)',
                fontSize: 16,
                transition: 'background 0.15s',
                position: 'relative',
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.background = 'var(--color-sidebar-bg)')
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.background = 'transparent')
              }
            >
              <svg
                width={16}
                height={16}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: 3,
                    right: 3,
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    background: '#EF4444',
                    color: '#fff',
                    fontSize: 9,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: 1,
                    pointerEvents: 'none',
                  }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification dropdown */}
            {isNotifOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  right: 0,
                  width: 320,
                  background: '#fff',
                  borderRadius: 8,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                  border: '1px solid var(--color-border)',
                  zIndex: 100,
                  overflow: 'hidden',
                  animation: 'modalIn 0.15s ease-out',
                }}
              >
                {/* Header */}
                <div
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    알림 내역
                  </span>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => {
                        fetch('/api/notifications/logs', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ action: 'markAllRead' }),
                        })
                          .then(() => {
                            setUnreadCount(0);
                            setNotifLogs((prev) => prev.map((l) => ({ ...l, isRead: true })));
                          })
                          .catch(() => {});
                      }}
                      style={{
                        fontSize: 11,
                        color: 'var(--color-accent)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        padding: 0,
                      }}
                    >
                      모두 읽음
                    </button>
                  )}
                </div>

                {/* Log list */}
                <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                  {notifLogs.length === 0 ? (
                    <div
                      style={{
                        padding: '24px 16px',
                        textAlign: 'center',
                        fontSize: 13,
                        color: 'var(--color-text-muted)',
                      }}
                    >
                      알림이 없습니다
                    </div>
                  ) : (
                    notifLogs.slice(0, 5).map((log) => (
                      <div
                        key={log.id}
                        style={{
                          padding: '10px 16px',
                          borderBottom: '1px solid var(--color-border)',
                          background:
                            log.status === 'FAILED'
                              ? '#FEF2F2'
                              : log.isRead
                                ? 'transparent'
                                : '#F0FDF4',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            marginBottom: 4,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 600,
                              padding: '1px 6px',
                              borderRadius: 4,
                              background:
                                log.channel === 'slack' ? '#E0F2FE' : '#EDE9FE',
                              color: log.channel === 'slack' ? '#0369A1' : '#6D28D9',
                              textTransform: 'uppercase',
                            }}
                          >
                            {log.channel}
                          </span>
                          {log.status === 'FAILED' && (
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 600,
                                padding: '1px 6px',
                                borderRadius: 4,
                                background: '#FEE2E2',
                                color: '#DC2626',
                              }}
                            >
                              실패
                            </span>
                          )}
                          <span
                            style={{
                              fontSize: 11,
                              color: 'var(--color-text-muted)',
                              marginLeft: 'auto',
                            }}
                          >
                            {timeAgo(log.sentAt)}
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color:
                              log.status === 'FAILED'
                                ? '#DC2626'
                                : 'var(--color-text-secondary)',
                            lineHeight: 1.4,
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {log.status === 'FAILED' && log.errorMessage
                            ? log.errorMessage
                            : log.message.split('\n')[0]}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Settings link */}
          <Link
            href="/settings"
            title="설정"
            style={{
              width: 32,
              height: 32,
              border: 'none',
              background: 'transparent',
              borderRadius: 'var(--radius-button)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-text-secondary)',
              fontSize: 16,
              transition: 'background 0.15s',
              textDecoration: 'none',
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.background = 'var(--color-sidebar-bg)')
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.background = 'transparent')
            }
          >
            <svg
              width={16}
              height={16}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx={12} cy={12} r={3} />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </Link>

          {/* User Avatar + Dropdown */}
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              title={displayName}
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: avatarColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                border: 'none',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              {initial}
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  right: 0,
                  width: 240,
                  background: '#fff',
                  borderRadius: 8,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                  border: '1px solid var(--color-border)',
                  zIndex: 100,
                  overflow: 'hidden',
                  animation: 'modalIn 0.15s ease-out',
                }}
              >
                {/* User Info */}
                <div
                  style={{
                    padding: '14px 16px',
                    borderBottom: '1px solid var(--color-border)',
                  }}
                >
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: 'var(--color-text-primary)',
                      marginBottom: 2,
                    }}
                  >
                    {displayName}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    {user?.email ?? ''}
                  </div>
                </div>

                {/* Menu Items */}
                <div style={{ padding: '4px 0' }}>
                  <button
                    className="header-dropdown-item"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setIsProfileOpen(true);
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 16px',
                      border: 'none',
                      background: 'transparent',
                      textAlign: 'left',
                      fontSize: 13,
                      color: 'var(--color-text-primary)',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      transition: 'background 0.1s',
                    }}
                  >
                    <svg
                      width={15}
                      height={15}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ color: 'var(--color-text-muted)', flexShrink: 0 }}
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx={12} cy={7} r={4} />
                    </svg>
                    프로필 설정
                  </button>

                  <div style={{ height: 1, background: 'var(--color-border)', margin: '4px 0' }} />

                  <button
                    className="header-dropdown-item"
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    style={{
                      width: '100%',
                      padding: '10px 16px',
                      border: 'none',
                      background: 'transparent',
                      textAlign: 'left',
                      fontSize: 13,
                      color: '#EF4444',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      transition: 'background 0.1s',
                    }}
                  >
                    <svg
                      width={15}
                      height={15}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ flexShrink: 0 }}
                    >
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1={21} y1={12} x2={9} y2={12} />
                    </svg>
                    로그아웃
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Profile Modal */}
      {memberId && (
        <ProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          memberId={memberId}
          initialDisplayName={displayName}
          initialColor={avatarColor}
          onSaved={handleProfileSaved}
        />
      )}
    </>
  );
}
