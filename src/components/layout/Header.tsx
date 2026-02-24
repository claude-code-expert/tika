'use client';

import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';

interface HeaderProps {
  onNewTask: () => void;
}

export function Header({ onNewTask }: HeaderProps) {
  const { data: session } = useSession();
  const user = session?.user;
  const initials = user?.name ? user.name.charAt(0) : 'U';

  return (
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
      }}
    >
      {/* Left: Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link
          href="/"
          style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: 'var(--color-text-primary)' }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              background: 'var(--color-accent)',
              borderRadius: 'var(--radius-button)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: 16,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              flexShrink: 0,
            }}
          >
            T
          </div>
          <span
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 700,
              fontSize: 20,
              letterSpacing: '-0.5px',
            }}
          >
            Tika
          </span>
        </Link>
      </div>

      {/* Center: Search */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '0 24px' }}>
        <div style={{ position: 'relative', width: 300 }}>
          <svg
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-text-muted)',
              width: 14,
              height: 14,
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
            placeholder="검색..."
            disabled
            style={{
              width: '100%',
              height: 36,
              padding: '0 12px 0 34px',
              background: 'var(--color-sidebar-bg)',
              border: '1px solid transparent',
              borderRadius: 'var(--radius-button)',
              fontSize: 12,
              color: 'var(--color-text-primary)',
              outline: 'none',
              cursor: 'not-allowed',
            }}
          />
        </div>
      </div>

      {/* Right: Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button
          onClick={onNewTask}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            height: 34,
            padding: '0 12px',
            background: 'var(--color-accent)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius-button)',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--color-accent-hover)')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--color-accent)')}
        >
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14" />
            <path d="M5 12h14" />
          </svg>
          새 업무
        </button>

        <div style={{ width: 1, height: 24, background: 'var(--color-border)', margin: '0 8px' }} />

        {/* User Avatar with signout dropdown */}
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          title={`${user?.name ?? '사용자'} (클릭하여 로그아웃)`}
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: '#7EB4A2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 600,
            fontSize: 12,
            cursor: 'pointer',
            border: '2px solid transparent',
            transition: 'border-color 0.15s',
            fontFamily: 'inherit',
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--color-accent)')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'transparent')}
        >
          {initials}
        </button>
      </div>
    </header>
  );
}
