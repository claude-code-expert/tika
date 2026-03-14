'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { ProfileModal } from './ProfileModal';
import { MemberDrawer } from '@/components/settings/MemberDrawer';
import type { Member, InAppNotification } from '@/types/index';
import { X, ArrowRight, Users } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
import { useOutsideClick } from '@/hooks/useOutsideClick';

interface HeaderProps {
  onNewTask?: () => void;
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
  const pathname = usePathname();
  const user = session?.user;
  const memberId = (user as Record<string, unknown> | undefined)?.memberId as number | undefined;
  const workspaceId = (user as Record<string, unknown> | undefined)?.workspaceId as number | null | undefined;

  // Derive logo link from current URL — preserve workspace context
  const logoHref = (() => {
    const match = pathname.match(/^\/workspace\/(\d+)/);
    return match ? `/workspace/${match[1]}` : '/';
  })();

  const [member, setMember] = useState<Member | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Notification state
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [memberAlertCount, setMemberAlertCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const [isMemberDrawerOpen, setIsMemberDrawerOpen] = useState(false);

  const sessionMemberColor = (user as Record<string, unknown> | undefined)?.memberColor as string | undefined;
  const displayName = member?.displayName ?? user?.name ?? '사용자';
  const avatarColor = member?.color ?? sessionMemberColor ?? '#629584';
  const initial = displayName.slice(0, 2).toUpperCase();

  // Mobile detection
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Fetch workspaces, member, in-app notifications in parallel
  useEffect(() => {
    if (!user) return;
    Promise.all([
      fetch('/api/members').then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch('/api/notifications/in-app?limit=5').then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch('/api/notifications/in-app/unread-count').then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch('/api/notifications/in-app/member-alert-count').then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ]).then(([membersData, notifData, countData, memberAlertData]: [
      { members?: Member[] } | null,
      { notifications?: InAppNotification[] } | null,
      { count?: number } | null,
      { count?: number } | null,
    ]) => {
      if (membersData?.members?.length) {
        const myMember = membersData.members.find((m) => m.id === memberId) ?? membersData.members[0];
        setMember(myMember);
      }
      if (notifData?.notifications) {
        setNotifications(notifData.notifications);
      }
      if (countData) {
        setUnreadCount(countData.count ?? 0);
      }
      if (memberAlertData) {
        setMemberAlertCount(memberAlertData.count ?? 0);
      }
    });
  }, [user]);

  // Close notif dropdown on outside click → mark as read
  const handleNotifClose = useCallback(() => {
    setIsNotifOpen(false);
    if (unreadCount > 0) {
      fetch('/api/notifications/in-app/read-all', { method: 'PATCH' })
        .then(() => {
          setUnreadCount(0);
          setMemberAlertCount(0);
          setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        })
        .catch(() => {});
    }
  }, [unreadCount]);

  useOutsideClick(notifRef, isNotifOpen, handleNotifClose);
  useOutsideClick(dropdownRef, isDropdownOpen, () => setIsDropdownOpen(false));

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
          {isMobile && onToggleSidebar && (
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
            href={logoHref}
            style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}
          >
            <Image
              src="/images/icon/tika-logo-header.png"
              alt="Tika"
              width={45}
              height={20}
              style={{ objectFit: 'contain', flexShrink: 0 }}
              priority
            />
            {!isMobile && (
              <span
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontWeight: 600,
                  fontSize: 13,
                  color: 'var(--color-text-secondary)',
                  whiteSpace: 'nowrap',
                }}
              >
                Plan Simply. Ship Boldly.
              </span>
            )}
          </Link>
        </div>

        {/* Center: Search (only when search handler provided) */}
        {onSearch !== undefined && <div style={{ flex: 1, maxWidth: 400, margin: '0 auto' }}>
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
                  lineHeight: 1,
                  padding: 2,
                  display: 'flex',
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>}

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          {onNewTask && (
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
          )}

          {/* Member management button → opens drawer */}
          <Tooltip content="멤버 관리" position="bottom">
          <button
            onClick={() => setIsMemberDrawerOpen(true)}
            aria-label="멤버 관리"
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
              transition: 'background 0.15s, color 0.15s',
              flexShrink: 0,
              position: 'relative',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'var(--color-sidebar-bg)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'transparent';
            }}
          >
            <Users size={16} />
            {memberAlertCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: 3,
                  right: 3,
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: 'var(--color-accent)',
                  pointerEvents: 'none',
                }}
              />
            )}
          </button>
          </Tooltip>

          {/* Notification button + dropdown */}
          <div ref={notifRef} style={{ position: 'relative' }}>
            <Tooltip content="알림" position="bottom">
            <button
              aria-label="알림"
              onClick={() => {
                setIsNotifOpen((prev) => {
                  if (!prev) { setIsDropdownOpen(false); }
                  return !prev;
                });
              }}
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
            </Tooltip>

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
                  <Link
                    href="/notifications"
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--color-text-primary)',
                      textDecoration: 'none',
                    }}
                    onClick={() => setIsNotifOpen(false)}
                  >
                    알림 내역
                  </Link>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => {
                        fetch('/api/notifications/in-app/read-all', { method: 'PATCH' })
                          .then(() => {
                            setUnreadCount(0);
                            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
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

                {/* Notification list */}
                <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
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
                    notifications.map((notif) => (
                      <a
                        key={notif.id}
                        href={notif.link ?? '#'}
                        onClick={(e) => {
                          const isMemberNotif =
                            notif.type === 'JOIN_REQUEST_RECEIVED' ||
                            notif.type === 'MEMBER_JOINED';
                          if (isMemberNotif || !notif.link) e.preventDefault();
                          setIsNotifOpen(false);
                          if (isMemberNotif) setIsMemberDrawerOpen(true);
                          if (!notif.isRead) {
                            fetch(`/api/notifications/in-app/${notif.id}/read`, { method: 'PATCH' })
                              .then(() => {
                                setNotifications((prev) => prev.map((n) => n.id === notif.id ? { ...n, isRead: true } : n));
                                setUnreadCount((c) => Math.max(0, c - 1));
                              })
                              .catch(() => {});
                          }
                        }}
                        style={{
                          display: 'block',
                          padding: '10px 16px',
                          borderBottom: '1px solid var(--color-border)',
                          background: notif.isRead ? 'transparent' : '#F0FDF4',
                          textDecoration: 'none',
                          transition: 'background 0.1s',
                        }}
                        onMouseEnter={(e) => {
                          if (notif.isRead) (e.currentTarget as HTMLElement).style.background = '#F8F9FB';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.background = notif.isRead ? 'transparent' : '#F0FDF4';
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
                              fontSize: 11,
                              fontWeight: 600,
                              color: 'var(--color-text-primary)',
                            }}
                          >
                            {notif.title}
                          </span>
                          <span
                            style={{
                              fontSize: 11,
                              color: 'var(--color-text-muted)',
                              marginLeft: 'auto',
                              flexShrink: 0,
                            }}
                          >
                            {timeAgo(notif.createdAt)}
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: 'var(--color-text-secondary)',
                            lineHeight: 1.4,
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {notif.message}
                        </div>
                      </a>
                    ))
                  )}
                </div>
                {/* Footer: link to full notifications page */}
                <Link
                  href="/notifications"
                  onClick={() => setIsNotifOpen(false)}
                  style={{
                    display: 'block',
                    padding: '10px 16px',
                    textAlign: 'center',
                    fontSize: 12,
                    color: 'var(--color-accent)',
                    textDecoration: 'none',
                    borderTop: '1px solid var(--color-border)',
                  }}
                >
                  전체 보기 <ArrowRight size={12} style={{ display: 'inline-block', verticalAlign: 'middle' }} />
                </Link>
              </div>
            )}
          </div>

          {/* Settings link */}
          <Tooltip content="설정" position="bottom">
          <Link
            href="/settings"
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
          </Tooltip>

          {/* User Avatar + Dropdown */}
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
              onClick={() => {
                setIsDropdownOpen((prev) => {
                  if (!prev) { setIsNotifOpen(false); }
                  return !prev;
                });
              }}
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
          userEmail={user?.email ?? undefined}
        />
      )}

      {/* Member Drawer */}
      <MemberDrawer
        workspaceId={workspaceId ?? 0}
        isOpen={isMemberDrawerOpen}
        onClose={() => setIsMemberDrawerOpen(false)}
      />

    </>
  );
}
