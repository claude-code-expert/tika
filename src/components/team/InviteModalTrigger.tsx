'use client';

import { useState } from 'react';
import { InviteModal } from './InviteModal';

interface InviteModalTriggerProps {
  workspaceId: number;
}

export function InviteModalTrigger({ workspaceId }: InviteModalTriggerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          padding: '8px 16px',
          borderRadius: 7,
          background: '#629584',
          color: '#fff',
          fontSize: 13,
          fontWeight: 600,
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span style={{ fontSize: 16 }}>+</span>
        팀원 초대
      </button>
      {open && <InviteModal workspaceId={workspaceId} onClose={() => setOpen(false)} />}
    </>
  );
}
