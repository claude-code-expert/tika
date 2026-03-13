'use client';

import { useState, useRef } from 'react';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom';
}

export function Tooltip({ content, children, position = 'top' }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const show = () => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setCoords({
      top: position === 'top' ? rect.top - 8 : rect.bottom + 8,
      left: rect.left + rect.width / 2,
    });
    setVisible(true);
  };

  return (
    <div
      ref={ref}
      style={{ display: 'inline-flex', position: 'relative' }}
      onMouseEnter={show}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && coords && (
        <div
          style={{
            position: 'fixed',
            top: position === 'top' ? coords.top : coords.top,
            left: coords.left,
            transform: position === 'top' ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
            background: '#1E293B',
            color: '#fff',
            fontSize: 11,
            fontWeight: 500,
            padding: '5px 10px',
            borderRadius: 6,
            whiteSpace: 'nowrap',
            zIndex: 9999,
            pointerEvents: 'none',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            lineHeight: 1.5,
          }}
        >
          {content}
          <div
            style={{
              position: 'absolute',
              [position === 'top' ? 'bottom' : 'top']: -4,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '4px solid transparent',
              borderRight: '4px solid transparent',
              ...(position === 'top'
                ? { borderTop: '4px solid #1E293B' }
                : { borderBottom: '4px solid #1E293B' }),
            }}
          />
        </div>
      )}
    </div>
  );
}
