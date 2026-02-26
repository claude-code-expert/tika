'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { ProfileModal } from './ProfileModal';
import type { Member } from '@/types/index';

interface HeaderProps {
  onNewTask: () => void;
  searchQuery?: string;
  onSearch?: (q: string) => void;
}

export function Header({ onNewTask, searchQuery = '', onSearch }: HeaderProps) {
  const { data: session } = useSession();
  const user = session?.user;
  const memberId = (user as Record<string, unknown> | undefined)?.memberId as number | undefined;

  const [member, setMember] = useState<Member | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const displayName = member?.displayName ?? user?.name ?? '사용자';
  const avatarColor = member?.color ?? '#629584';
  const initial = displayName.slice(0, 2).toUpperCase();

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
        {/* Left: Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
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
            style={{
              height: 32,
              padding: '0 14px',
              background: 'var(--color-accent)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius-button)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'background 0.15s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.background = 'var(--color-accent-hover)')
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.background = 'var(--color-accent)')
            }
          >
            + 새 업무
          </button>

          {/* Notification button */}
          <button
            title="알림 기능은 준비 중입니다"
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
          </button>

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
