'use client';

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
  isCreating: boolean;
  onCreateClose: () => void;
  selectedTicket: TicketWithMeta | null;
  onSelectTicket: (ticket: TicketWithMeta | null) => void;
}

export function BoardContainer({
  board,
  isLoading,
  createTicket,
  updateTicket,
  deleteTicket,
  isCreating,
  onCreateClose,
  selectedTicket,
  onSelectTicket,
}: BoardContainerProps) {
  const handleCreate = async (data: CreateTicketInput | UpdateTicketInput) => {
    await createTicket(data as CreateTicketInput);
    onCreateClose();
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
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <Board board={board} onTicketClick={onSelectTicket} />
      </div>

      {/* Create modal */}
      <Modal isOpen={isCreating} onClose={onCreateClose} title="새 업무 생성">
        <TicketForm mode="create" onSubmit={handleCreate} onCancel={onCreateClose} />
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
        />
      )}
    </>
  );
}
