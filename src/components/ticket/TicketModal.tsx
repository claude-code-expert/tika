'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { TicketForm } from './TicketForm';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { COLUMN_LABELS } from '@/types';
import type { TicketWithMeta, UpdateTicketInput } from '@/types';

interface TicketModalProps {
  ticket: TicketWithMeta;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: number, data: UpdateTicketInput) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export function TicketModal({ ticket, isOpen, onClose, onUpdate, onDelete }: TicketModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdate = async (data: UpdateTicketInput) => {
    setIsLoading(true);
    try {
      await onUpdate(ticket.id, data);
      setIsEditing(false);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await onDelete(ticket.id);
      setIsDeleting(false);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? '티켓 수정' : '티켓 상세'}>
        {isEditing ? (
          <TicketForm
            mode="edit"
            initialData={ticket}
            onSubmit={(data) => handleUpdate(data as UpdateTicketInput)}
            onCancel={() => setIsEditing(false)}
            isLoading={isLoading}
          />
        ) : (
          <div className="space-y-4">
            {/* 제목 */}
            <h3 className="text-lg font-semibold text-gray-900">{ticket.title}</h3>

            {/* 상태 + 우선순위 */}
            <div className="flex items-center gap-3">
              <span className="rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                {COLUMN_LABELS[ticket.status]}
              </span>
              <Badge priority={ticket.priority} />
              {ticket.isOverdue && (
                <span className="text-xs font-medium text-red-600">⚠ 마감 초과</span>
              )}
            </div>

            {/* 설명 */}
            {ticket.description && (
              <div>
                <p className="text-xs font-medium text-gray-500">설명</p>
                <p className="mt-1 text-sm whitespace-pre-wrap text-gray-700">
                  {ticket.description}
                </p>
              </div>
            )}

            {/* 날짜 정보 */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              {ticket.dueDate && (
                <div>
                  <p className="text-xs font-medium text-gray-500">마감일</p>
                  <p className={ticket.isOverdue ? 'text-red-600' : 'text-gray-700'}>
                    {ticket.dueDate}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs font-medium text-gray-500">생성일</p>
                <p className="text-gray-700">
                  {new Date(ticket.createdAt).toLocaleDateString('ko-KR')}
                </p>
              </div>
              {ticket.completedAt && (
                <div>
                  <p className="text-xs font-medium text-gray-500">완료일</p>
                  <p className="text-gray-700">
                    {new Date(ticket.completedAt).toLocaleDateString('ko-KR')}
                  </p>
                </div>
              )}
            </div>

            {/* 액션 버튼 */}
            <div className="flex justify-between border-t pt-4">
              <Button variant="danger" size="sm" onClick={() => setIsDeleting(true)}>
                삭제
              </Button>
              <Button variant="primary" size="sm" onClick={() => setIsEditing(true)}>
                수정
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* 삭제 확인 다이얼로그 */}
      <ConfirmDialog
        isOpen={isDeleting}
        title="티켓 삭제"
        message={`"${ticket.title}" 티켓을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        onConfirm={handleDelete}
        onCancel={() => setIsDeleting(false)}
      />
    </>
  );
}
