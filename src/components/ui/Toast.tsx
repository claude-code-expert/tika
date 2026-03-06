'use client';

interface ToastProps {
  message: string;
}

export function Toast({ message }: ToastProps) {
  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'rgba(44, 62, 80, 0.92)',
        color: '#fff',
        fontSize: 13,
        fontWeight: 500,
        padding: '10px 20px',
        borderRadius: 8,
        zIndex: 9999,
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      {message}
    </div>
  );
}
