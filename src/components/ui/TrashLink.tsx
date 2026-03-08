'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

function TrashIcon() {
  return (
    <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" /><path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

interface TrashLinkProps {
  trashHref: string;
  iconOnly?: boolean;
}

export function TrashLink({ trashHref, iconOnly = false }: TrashLinkProps) {
  const pathname = usePathname();
  const isActive = pathname.startsWith(trashHref);

  return (
    <div style={{ borderTop: '1px solid #DFE1E6', flexShrink: 0 }}>
      <Link
        href={trashHref}
        title={iconOnly ? '휴지통' : undefined}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: iconOnly ? 'center' : 'flex-start',
          gap: iconOnly ? 0 : 8,
          height: 30,
          padding: iconOnly ? '0' : '0 16px',
          fontSize: 11,
          color: isActive ? '#629584' : '#5A6B7F',
          fontWeight: isActive ? 500 : 400,
          background: isActive ? '#E8F5F0' : 'transparent',
          textDecoration: 'none',
          transition: 'background 0.1s, color 0.1s',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            e.currentTarget.style.background = '#E2E5EA';
            e.currentTarget.style.color = '#2C3E50';
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#5A6B7F';
          }
        }}
      >
        <span style={{ color: isActive ? '#629584' : '#8993A4', display: 'inline-flex', flexShrink: 0 }}>
          <TrashIcon />
        </span>
        {!iconOnly && '휴지통'}
      </Link>
    </div>
  );
}
