export function Footer() {
  return (
    <footer
      style={{
        height: 'var(--footer-height)',
        background: 'var(--color-footer-bg)',
        borderTop: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 16px',
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
        Made with{' '}
        <span style={{ color: '#e25555', margin: '0 2px' }}>♥</span>
        {' '}for productivity · © 2026 Tika
      </span>
    </footer>
  );
}
