'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Shared resize handle hook used by Sidebar, TeamSidebar, and BacklogPanel.
 * Handles col-resize drag with proper cleanup on unmount (prevents event listener leaks).
 */
export function useResizable(defaultWidth: number, min: number, max: number) {
  const [width, setWidth] = useState(defaultWidth);
  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(defaultWidth);
  const cleanupRef = useRef<(() => void) | null>(null);

  // Cleanup dangling listeners if component unmounts during resize
  useEffect(() => {
    return () => {
      cleanupRef.current?.();
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, []);

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isResizing.current = true;
      startX.current = e.clientX;
      startWidth.current = width;

      const onMove = (ev: MouseEvent) => {
        if (!isResizing.current) return;
        const delta = ev.clientX - startX.current;
        setWidth(Math.max(min, Math.min(max, startWidth.current + delta)));
      };

      const onUp = () => {
        isResizing.current = false;
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        cleanupRef.current = null;
      };

      cleanupRef.current = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    },
    [width, min, max],
  );

  return { width, handleResizeStart, isResizing };
}
