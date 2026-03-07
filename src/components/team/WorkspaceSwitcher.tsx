'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { WorkspaceWithRole } from '@/types/index';

interface WorkspaceSwitcherProps {
  currentWorkspaceId: number;
  currentWorkspaceName?: string;
}

export function WorkspaceSwitcher({ currentWorkspaceId, currentWorkspaceName }: WorkspaceSwitcherProps) {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<WorkspaceWithRole[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/workspaces')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { workspaces?: WorkspaceWithRole[] } | null) => {
        if (data?.workspaces) setWorkspaces(data.workspaces);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const current = workspaces.find((w) => w.id === currentWorkspaceId);
  // Use server-provided name as fallback to avoid flash of '워크스페이스' before API loads
  const currentName = current?.name ?? currentWorkspaceName ?? '워크스페이스';
  const currentIconColor = current?.iconColor ?? '#629584';

  function handleSelect(ws: WorkspaceWithRole) {
    setOpen(false);
    if (ws.type === 'TEAM') {
      router.push(`/workspace/${ws.id}`);
    } else {
      router.push('/');
    }
  }

  return (
    <div ref={ref} style={{ position: 'relative', flex: 1 }}>
      <button
        onClick={() => setOpen((p) => !p)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          width: '100%',
          padding: '6px 8px',
          borderRadius: 6,
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          transition: 'background 0.1s',
          textAlign: 'left',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#DFE1E6')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        {/* Workspace icon */}
        <div
          style={{
            width: 28, height: 28,
            borderRadius: 6,
            background: currentIconColor,
            color: '#fff',
            fontSize: 13,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {currentName.slice(0, 1).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: '#2C3E50',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            {currentName}
          </div>
        </div>
        {/* Chevron */}
        <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#8993A4" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 4,
            background: '#fff',
            border: '1px solid #DFE1E6',
            borderRadius: 8,
            boxShadow: '0 8px 24px rgba(0,0,0,.12)',
            zIndex: 200,
            overflow: 'hidden',
          }}
        >
          {workspaces.map((ws) => (
            <button
              key={ws.id}
              onClick={() => handleSelect(ws)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                padding: '8px 12px',
                border: 'none',
                background: ws.id === currentWorkspaceId ? '#F0FDF4' : 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.1s',
              }}
              onMouseEnter={(e) => { if (ws.id !== currentWorkspaceId) e.currentTarget.style.background = '#F1F3F6'; }}
              onMouseLeave={(e) => { if (ws.id !== currentWorkspaceId) e.currentTarget.style.background = 'transparent'; }}
            >
              <div
                style={{
                  width: 24, height: 24,
                  borderRadius: 4,
                  background: ws.iconColor ?? (ws.type === 'TEAM' ? '#629584' : '#8993A4'),
                  color: '#fff',
                  fontSize: 11,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {ws.name.slice(0, 1).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#2C3E50', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {ws.name}
                </div>
                <div style={{ fontSize: 10, color: '#8993A4' }}>
                  {ws.type === 'TEAM' ? '팀' : '개인'} · {ws.role === 'OWNER' ? '관리자' : ws.role === 'MEMBER' ? '멤버' : '뷰어'}
                </div>
              </div>
              {ws.id === currentWorkspaceId && (
                <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#629584" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          ))}

          <div style={{ borderTop: '1px solid #DFE1E6', padding: '6px 8px' }}>
            <button
              onClick={() => { setOpen(false); router.push('/'); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                padding: '6px 8px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                borderRadius: 4,
                fontSize: 12,
                color: '#8993A4',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#F1F3F6')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              개인 보드로 이동
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
