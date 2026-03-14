'use client';

import { useState } from 'react';
import { Board } from './Board';
import { Modal } from '@/components/ui/Modal';
import { TicketForm } from '@/components/ticket/TicketForm';
import { TicketModal } from '@/components/ticket/TicketModal';
import type { TicketWithMeta, BoardData } from '@/types/index';
import type { CreateTicketInput, UpdateTicketInput } from '@/lib/validations';

interface BoardContainerProps {
  board: BoardData;
  isLoading: boolean;
  createTicket: (data: CreateTicketInput) => Promise<unknown>;
  updateTicket: (id: number, data: UpdateTicketInput) => Promise<unknown>;
  deleteTicket: (id: number) => Promise<void>;
  onDuplicate?: (ticket: TicketWithMeta) => Promise<void>;
  isCreating: boolean;
  onCreateClose: () => void;
  selectedTicket: TicketWithMeta | null;
  onSelectTicket: (ticket: TicketWithMeta | null) => void;
  currentMemberId?: number | null;
  readOnly?: boolean;
}

export function BoardContainer({
  board,
  isLoading,
  createTicket,
  updateTicket,
  deleteTicket,
  onDuplicate,
  isCreating,
  onCreateClose,
  selectedTicket,
  onSelectTicket,
  currentMemberId = null,
  readOnly = false,
}: BoardContainerProps) {
  const [createTitle, setCreateTitle] = useState('');

  const handleCreateClose = () => {
    setCreateTitle('');
    onCreateClose();
  };

  const handleCreate = async (
    data: CreateTicketInput | UpdateTicketInput,
    extra?: { checklistTexts?: string[] },
  ) => {
    const ticket = (await createTicket(data as CreateTicketInput)) as { id: number };

    // Add checklist items after ticket creation
    if (extra?.checklistTexts && extra.checklistTexts.length > 0 && ticket?.id) {
      for (const text of extra.checklistTexts) {
        await fetch(`/api/tickets/${ticket.id}/checklist`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        }).catch(() => {});
      }
    }

    handleCreateClose();
  };

  if (isLoading) {
    return (
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--color-board-bg)',
        }}
      >
        <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
          보드를 불러오는 중...
        </span>
      </div>
    );
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <Board board={board} onTicketClick={onSelectTicket} currentMemberId={currentMemberId} />
      </div>

      {/* Create modal */}
      <Modal
        isOpen={isCreating}
        onClose={handleCreateClose}
        resizable
        maxWidth={800}
        headerContent={
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <label
              htmlFor="modal-ticket-title"
              style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', flexShrink: 0 }}
            >
              제목 <span style={{ color: '#DC2626' }}>*</span>
            </label>
            <input
              id="modal-ticket-title"
              type="text"
              value={createTitle}
              onChange={(e) => setCreateTitle(e.target.value)}
              placeholder="업무 제목을 입력하세요"
              autoFocus
              style={{
                flex: 1,
                padding: '6px 10px',
                border: '1px solid var(--color-border)',
                borderRadius: 6,
                fontSize: 14,
                fontFamily: 'inherit',
                color: 'var(--color-text-primary)',
                background: '#ffffff',
                outline: 'none',
              }}
            />
          </div>
        }
      >
        <TicketForm
          mode="create"
          externalTitle={createTitle}
          onTitleChange={setCreateTitle}
          onSubmit={handleCreate}
          onCancel={handleCreateClose}
        />
      </Modal>

      {/* Detail modal */}
      {selectedTicket && (
        <TicketModal
          ticket={selectedTicket}
          isOpen={true}
          onClose={() => onSelectTicket(null)}
          onUpdate={async (id, data) => {
            await updateTicket(id, data);
            onSelectTicket(null);
          }}
          onDelete={async (id) => {
            await deleteTicket(id);
            onSelectTicket(null);
          }}
          onDuplicate={
            onDuplicate ? async () => onDuplicate(selectedTicket) : undefined
          }
          currentMemberId={currentMemberId}
          workspaceName={board.workspaceName}
          readOnly={readOnly}
        />
      )}
    </>
  );
}
