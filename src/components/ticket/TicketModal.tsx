'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ChecklistSection } from './ChecklistSection';
import { LabelSelector } from '@/components/label/LabelSelector';
import { IssueBreadcrumb } from '@/components/issue/IssueBreadcrumb';
import { Avatar } from '@/components/ui/Avatar';
import type { TicketWithMeta, ChecklistItem, Label } from '@/types/index';
import { TICKET_STATUS, TICKET_PRIORITY, TICKET_TYPE } from '@/types/index';
import { Button } from '@/components/ui/Button';
import type { UpdateTicketInput } from '@/lib/validations';

interface TicketModalProps {
  ticket: TicketWithMeta;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: number, data: UpdateTicketInput) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export function TicketModal({ ticket, isOpen, onClose, onUpdate, onDelete }: TicketModalProps) {
  const [title, setTitle] = useState(ticket.title);
  const [description, setDescription] = useState(ticket.description ?? '');
  const [status, setStatus] = useState(ticket.status);
  const [priority, setPriority] = useState(ticket.priority);
  const [dueDate, setDueDate] = useState(ticket.dueDate ?? '');
  const [type, setType] = useState(ticket.type);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>(ticket.checklistItems);
  const [allLabels, setAllLabels] = useState<Label[]>([]);
  const [selectedLabelIds, setSelectedLabelIds] = useState<number[]>(ticket.labels.map((l) => l.id));
  const [labelsLoaded, setLabelsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const isDirty =
    title !== ticket.title ||
    description !== (ticket.description ?? '') ||
    status !== ticket.status ||
    priority !== ticket.priority ||
    dueDate !== (ticket.dueDate ?? '') ||
    type !== ticket.type;

  const handleSave = async () => {
    if (!title.trim()) return;
    setIsSaving(true);
    try {
      const patch: UpdateTicketInput = {};
      if (title !== ticket.title) patch.title = title.trim();
      if (description !== (ticket.description ?? '')) patch.description = description || null;
      if (status !== ticket.status) patch.status = status;
      if (priority !== ticket.priority) patch.priority = priority;
      if (dueDate !== (ticket.dueDate ?? '')) patch.dueDate = dueDate || null;
      if (type !== ticket.type) patch.type = type;
      await onUpdate(ticket.id, patch);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    await onDelete(ticket.id);
    setShowDelete(false);
    onClose();
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl">
        <div className="flex flex-col">
          {/* Header */}
          <div className="flex items-start gap-3 border-b border-gray-100 px-6 py-4">
            <div className="flex-1">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border-none text-lg font-semibold text-gray-900 outline-none focus:ring-0"
                aria-label="티켓 제목"
              />
            </div>
            <button
              onClick={onClose}
              className="mt-0.5 rounded-lg p-1 text-gray-400 hover:bg-gray-100"
              aria-label="닫기"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="flex gap-6 px-6 py-4">
            {/* Left: description + checklist placeholder */}
            <div className="flex-1">
              {ticket.isOverdue && (
                <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                  ⚠ 마감 초과
                </div>
              )}
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={1000}
                rows={5}
                placeholder="설명을 입력하세요..."
                className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                aria-label="설명"
              />
              <ChecklistSection
                items={checklistItems}
                onAdd={async (text) => {
                  const res = await fetch(`/api/tickets/${ticket.id}/checklist`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text }),
                  });
                  if (res.ok) {
                    const { item } = await res.json();
                    setChecklistItems((prev) => [...prev, item]);
                  }
                }}
                onToggle={async (itemId, isCompleted) => {
                  const res = await fetch(`/api/tickets/${ticket.id}/checklist/${itemId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ isCompleted }),
                  });
                  if (res.ok) {
                    setChecklistItems((prev) =>
                      prev.map((i) => (i.id === itemId ? { ...i, isCompleted } : i)),
                    );
                  }
                }}
                onDelete={async (itemId) => {
                  await fetch(`/api/tickets/${ticket.id}/checklist/${itemId}`, {
                    method: 'DELETE',
                  });
                  setChecklistItems((prev) => prev.filter((i) => i.id !== itemId));
                }}
              />
            </div>

            {/* Right: metadata */}
            <div className="w-44 shrink-0 space-y-3 text-sm">
              {/* Type */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">유형</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as typeof TICKET_TYPE[keyof typeof TICKET_TYPE])}
                  className="w-full rounded border border-gray-200 px-2 py-1 text-xs focus:outline-none"
                  aria-label="유형"
                >
                  {Object.values(TICKET_TYPE).map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              {/* Status */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">상태</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as typeof TICKET_STATUS[keyof typeof TICKET_STATUS])}
                  className="w-full rounded border border-gray-200 px-2 py-1 text-xs focus:outline-none"
                  aria-label="상태"
                >
                  {Object.values(TICKET_STATUS).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              {/* Priority */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">우선순위</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as typeof TICKET_PRIORITY[keyof typeof TICKET_PRIORITY])}
                  className="w-full rounded border border-gray-200 px-2 py-1 text-xs focus:outline-none"
                  aria-label="우선순위"
                >
                  {Object.values(TICKET_PRIORITY).map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              {/* Due date */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">마감일</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded border border-gray-200 px-2 py-1 text-xs focus:outline-none"
                  aria-label="마감일"
                />
              </div>
              {/* Labels */}
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">라벨</label>
                <button
                  type="button"
                  onClick={async () => {
                    if (!labelsLoaded) {
                      const res = await fetch('/api/labels');
                      if (res.ok) {
                        const data = await res.json();
                        setAllLabels(data.labels);
                        setLabelsLoaded(true);
                      }
                    }
                  }}
                  className="mb-1 text-xs text-blue-500 hover:text-blue-700"
                >
                  {labelsLoaded ? '라벨 선택' : '라벨 불러오기'}
                </button>
                {labelsLoaded && (
                  <LabelSelector
                    labels={allLabels}
                    selectedIds={selectedLabelIds}
                    onToggle={async (labelId) => {
                      const newIds = selectedLabelIds.includes(labelId)
                        ? selectedLabelIds.filter((id) => id !== labelId)
                        : [...selectedLabelIds, labelId];
                      setSelectedLabelIds(newIds);
                      await fetch(`/api/tickets/${ticket.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ labelIds: newIds }),
                      });
                    }}
                    onCreateLabel={async (name, color) => {
                      const res = await fetch('/api/labels', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name, color }),
                      });
                      if (res.ok) {
                        const { label } = await res.json();
                        setAllLabels((prev) => [...prev, label]);
                      }
                    }}
                  />
                )}
              </div>
              {/* Assignee */}
              {ticket.assignee && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">담당자</label>
                  <Avatar
                    displayName={ticket.assignee.displayName}
                    color={ticket.assignee.color}
                    size="sm"
                  />
                </div>
              )}

              {/* Issue breadcrumb */}
              {ticket.issue && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">이슈</label>
                  <IssueBreadcrumb issue={ticket.issue} />
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-gray-100 px-6 py-3">
            <button
              onClick={() => setShowDelete(true)}
              className="text-xs text-red-500 hover:text-red-700"
            >
              삭제
            </button>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={onClose}>
                취소
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSave}
                disabled={!isDirty || !title.trim()}
                isLoading={isSaving}
              >
                저장
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={showDelete}
        message={`"${ticket.title}" 티켓을 삭제하시겠습니까?`}
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </>
  );
}
