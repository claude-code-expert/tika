'use client';

import { useEffect, useCallback, useState } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  maxWidth?: number;
}

export function Modal({ isOpen, onClose, children, title, maxWidth = 560 }: ModalProps) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 300,
        background: 'rgba(9,30,66,0.54)',
        display: 'flex',
        alignItems: isMobile ? 'flex-end' : 'center',
        justifyContent: 'center',
        padding: isMobile ? 0 : 20,
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      onClick={onClose}
    >
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .modal-close-btn:hover {
          background: var(--color-board-bg) !important;
          color: var(--color-text-primary) !important;
        }
      `}</style>

      <div
        style={{
          background: '#ffffff',
          borderRadius: isMobile ? '16px 16px 0 0' : 8,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          width: '100%',
          maxWidth: isMobile ? '100%' : maxWidth,
          maxHeight: isMobile ? '92vh' : '90vh',
          display: 'flex',
          flexDirection: 'column',
          animation: 'modalIn 0.2s ease-out',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (optional) */}
        {title && (
          <div
            style={{
              padding: '20px 24px 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}
          >
            <h2
              id="modal-title"
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 17,
                fontWeight: 700,
                color: 'var(--color-text-primary)',
              }}
            >
              {title}
            </h2>
            <button
              className="modal-close-btn"
              onClick={onClose}
              style={{
                width: 28,
                height: 28,
                border: 'none',
                background: 'transparent',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 18,
                color: 'var(--color-text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.1s, color 0.1s',
                fontFamily: 'inherit',
              }}
              aria-label="닫기"
            >
              ✕
            </button>
          </div>
        )}

        {children}
      </div>
    </div>
  );
}
