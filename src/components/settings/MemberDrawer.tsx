'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { MemberSection } from './MemberSection';
import type { ToastType } from './types';

interface MemberDrawerProps {
  workspaceId: number;
  isOpen: boolean;
  onClose: () => void;
}

export function MemberDrawer({ workspaceId, isOpen, onClose }: MemberDrawerProps) {
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  function showToast(message: string, type: ToastType = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(9,30,66,0.3)',
          zIndex: 200,
        }}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: 520,
          maxWidth: '100vw',
          height: '100vh',
          background: '#F8F9FB',
          zIndex: 201,
          boxShadow: '-4px 0 32px rgba(0,0,0,0.14)',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: "'Noto Sans KR', 'Plus Jakarta Sans', sans-serif",
        }}
      >
        {/* Drawer header */}
        <div
          style={{
            padding: '0 24px',
            height: 56,
            borderBottom: '1px solid #DFE1E6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#fff',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 700,
              fontSize: 15,
              color: '#2C3E50',
            }}
          >
            멤버 관리
          </span>
          <button
            onClick={onClose}
            aria-label="닫기"
            style={{
              width: 32,
              height: 32,
              border: 'none',
              background: 'transparent',
              borderRadius: 6,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#8993A4',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Drawer content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          <MemberSection showToast={showToast} workspaceId={workspaceId} />
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            top: 80,
            right: 540,
            padding: '10px 16px',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 500,
            boxShadow: '0 8px 24px rgba(0,0,0,.12)',
            zIndex: 202,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: "'Noto Sans KR', sans-serif",
            ...(toast.type === 'success'
              ? { background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0' }
              : toast.type === 'fail'
                ? { background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }
                : { background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE' }),
          }}
        >
          {toast.type === 'success' ? '✓' : toast.type === 'fail' ? '✕' : 'ℹ'} {toast.message}
        </div>
      )}
    </>
  );
}
