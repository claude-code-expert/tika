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
      <span style={{ fontSize: 12, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <a
          href="https://brewnet.dev"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#629584', textDecoration: 'none', fontWeight: 500 }}
        >
          Brewnet.dev
        </a>
        <span>·</span>
        <span>Project Owner</span>
        <a
          href="https://github.com/claude-code-expert"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#629584', textDecoration: 'none', fontWeight: 500 }}
        >
          CodeVillain
        </a>
        <span>· © 2026 Tika</span>
      </span>
    </footer>
  );
}
