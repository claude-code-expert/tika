import type React from 'react';

/**
 * 티켓 메타 패널(select·date 입력)에 공통으로 쓰이는 스타일 상수.
 * TicketModal / TicketForm / TicketDetailPage 가 이 파일에서 import한다.
 */

export const CHEVRON_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%239CA3AF' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round' fill='none'/%3E%3C/svg%3E") no-repeat right 6px center`;

export const metaSelectStyle: React.CSSProperties = {
  width: '100%',
  height: 28,
  padding: '0 24px 0 8px',
  border: '1px solid var(--color-border)',
  borderRadius: 6,
  fontFamily: 'inherit',
  fontSize: 12,
  color: 'var(--color-text-primary)',
  background: `var(--color-board-bg) ${CHEVRON_SVG}`,
  outline: 'none',
  cursor: 'pointer',
  appearance: 'none',
  WebkitAppearance: 'none',
};

export const metaDateStyle: React.CSSProperties = {
  width: '100%',
  height: 28,
  padding: '0 8px',
  border: '1px solid var(--color-border)',
  borderRadius: 6,
  fontFamily: 'inherit',
  fontSize: 12,
  color: 'var(--color-text-primary)',
  background: 'var(--color-board-bg)',
  outline: 'none',
  cursor: 'pointer',
};
