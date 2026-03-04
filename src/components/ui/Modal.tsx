'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  headerContent?: React.ReactNode;
  maxWidth?: number;
  resizable?: boolean;
}

export function Modal({ isOpen, onClose, children, title, headerContent, maxWidth = 560, resizable = false }: ModalProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [modalSize, setModalSize] = useState<{ width: number | null; height: number | null }>({ width: null, height: null });
  const modalRef = useRef<HTMLDivElement>(null);

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

  const startResize = useCallback((e: React.MouseEvent, direction: 'bottom' | 'right' | 'corner') => {
    e.preventDefault();
    e.stopPropagation();
    const rect = modalRef.current?.getBoundingClientRect();
    if (!rect) return;
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = rect.width;
    const startH = rect.height;

    const cursor = direction === 'bottom' ? 'ns-resize' : direction === 'right' ? 'ew-resize' : 'nwse-resize';
    document.body.style.cursor = cursor;
    document.body.style.userSelect = 'none';

    const onMouseMove = (ev: MouseEvent) => {
      const newW = direction !== 'bottom'
        ? Math.min(Math.max(startW + (ev.clientX - startX), 320), window.innerWidth * 0.95)
        : startW;
      const newH = direction !== 'right'
        ? Math.min(Math.max(startH + (ev.clientY - startY), 300), window.innerHeight * 0.95)
        : startH;
      setModalSize({
        width: direction !== 'bottom' ? newW : null,
        height: direction !== 'right' ? newH : null,
      });
    };
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      // Prevent the click event that follows mouseup from closing the modal
      const preventClick = (ev: MouseEvent) => {
        ev.stopPropagation();
        document.removeEventListener('click', preventClick, true);
      };
      document.addEventListener('click', preventClick, true);
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, []);

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
        .modal-resize-handle { opacity: 0.4; transition: opacity 0.15s; }
        .modal-resize-handle:hover { opacity: 1; }
      `}</style>

      <div
        ref={modalRef}
        style={{
          position: 'relative',
          background: '#ffffff',
          borderRadius: isMobile ? '16px 16px 0 0' : 8,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          width: modalSize.width ? `${modalSize.width}px` : '100%',
          maxWidth: isMobile ? '100%' : (modalSize.width ? 'none' : maxWidth),
          maxHeight: isMobile ? '92vh' : (modalSize.height ? 'none' : '90vh'),
          height: modalSize.height ? `${modalSize.height}px` : undefined,
          display: 'flex',
          flexDirection: 'column',
          animation: 'modalIn 0.2s ease-out',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header — always visible */}
        <div
          style={{
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexShrink: 0,
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            {headerContent ?? (
              title ? (
                <h2
                  id="modal-title"
                  style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: 17,
                    fontWeight: 700,
                    color: 'var(--color-text-primary)',
                    margin: 0,
                  }}
                >
                  {title}
                </h2>
              ) : null
            )}
          </div>
          <button
            className="modal-close-btn"
            onClick={onClose}
            style={{
              flexShrink: 0,
              width: 28,
              height: 28,
              border: 'none',
              background: 'transparent',
              borderRadius: 6,
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.1s, color 0.1s',
            }}
            aria-label="닫기"
          >
            <X size={16} />
          </button>
        </div>

        {children}

        {/* Bottom resize handle */}
        {resizable && !isMobile && (
          <div
            className="modal-resize-handle"
            onMouseDown={(e) => startResize(e, 'bottom')}
            style={{
              flexShrink: 0,
              height: 10,
              cursor: 'ns-resize',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              borderTop: '1px solid var(--color-border)',
            }}
          >
            <div style={{ width: 36, height: 3, borderRadius: 2, background: '#9CA3AF' }} />
          </div>
        )}

        {/* Right resize handle */}
        {resizable && !isMobile && (
          <div
            className="modal-resize-handle"
            onMouseDown={(e) => startResize(e, 'right')}
            style={{
              position: 'absolute',
              right: 0,
              top: 20,
              bottom: 12,
              width: 6,
              cursor: 'ew-resize',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{ width: 3, height: 36, borderRadius: 2, background: '#9CA3AF' }} />
          </div>
        )}

        {/* Corner resize handle */}
        {resizable && !isMobile && (
          <div
            className="modal-resize-handle"
            onMouseDown={(e) => startResize(e, 'corner')}
            style={{
              position: 'absolute',
              right: 0,
              bottom: 0,
              width: 16,
              height: 16,
              cursor: 'nwse-resize',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'flex-end',
              padding: 3,
            }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M9 1L1 9M9 5L5 9M9 9" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
