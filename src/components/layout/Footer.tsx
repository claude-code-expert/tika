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
      <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
        © 2026 Tika. All rights reserved.
      </span>
    </footer>
  );
}
