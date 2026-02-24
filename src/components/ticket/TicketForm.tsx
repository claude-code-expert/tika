'use client';

import { useState } from 'react';
import type { TicketWithMeta } from '@/types/index';
import { TICKET_TYPE, TICKET_PRIORITY } from '@/types/index';
import { Button } from '@/components/ui/Button';
import type { CreateTicketInput, UpdateTicketInput } from '@/lib/validations';

interface TicketFormProps {
  mode?: 'create' | 'edit';
  initialData?: Partial<TicketWithMeta>;
  onSubmit: (data: CreateTicketInput | UpdateTicketInput) => Promise<void>;
  onCancel: () => void;
}

export function TicketForm({ mode = 'create', initialData, onSubmit, onCancel }: TicketFormProps) {
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [type, setType] = useState(initialData?.type ?? 'TASK');
  const [priority, setPriority] = useState(initialData?.priority ?? 'MEDIUM');
  const [dueDate, setDueDate] = useState(initialData?.dueDate ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [titleError, setTitleError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setTitleError('제목을 입력해주세요');
      return;
    }
    setTitleError('');
    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        type: type as typeof TICKET_TYPE[keyof typeof TICKET_TYPE],
        priority: priority as typeof TICKET_PRIORITY[keyof typeof TICKET_PRIORITY],
        dueDate: dueDate || null,
        description: description || null,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
      {/* Title */}
      <div>
        <label htmlFor="ticket-title" className="mb-1 block text-sm font-medium text-gray-700">
          제목 <span className="text-red-500">*</span>
        </label>
        <input
          id="ticket-title"
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (e.target.value.trim()) setTitleError('');
          }}
          maxLength={200}
          placeholder="업무 제목을 입력하세요"
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          autoFocus
        />
        {titleError && <p className="mt-1 text-xs text-red-500">{titleError}</p>}
      </div>

      {/* Type + Priority row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="ticket-type" className="mb-1 block text-sm font-medium text-gray-700">
            유형
          </label>
          <select
            id="ticket-type"
            value={type}
            onChange={(e) => setType(e.target.value as keyof typeof TICKET_TYPE)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="GOAL">Goal</option>
            <option value="STORY">Story</option>
            <option value="FEATURE">Feature</option>
            <option value="TASK">Task</option>
          </select>
        </div>
        <div>
          <label htmlFor="ticket-priority" className="mb-1 block text-sm font-medium text-gray-700">
            우선순위
          </label>
          <select
            id="ticket-priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as typeof TICKET_PRIORITY[keyof typeof TICKET_PRIORITY])}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>
      </div>

      {/* Due date */}
      <div>
        <label htmlFor="ticket-due-date" className="mb-1 block text-sm font-medium text-gray-700">
          마감일
        </label>
        <input
          id="ticket-due-date"
          type="date"
          value={dueDate}
          min={today}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="ticket-description"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          설명
        </label>
        <textarea
          id="ticket-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={1000}
          rows={3}
          placeholder="업무 설명 (선택)"
          className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
        <p className="mt-0.5 text-right text-[10px] text-gray-400">{description.length}/1000</p>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 border-t border-gray-100 pt-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
          {mode === 'create' ? '생성' : '저장'}
        </Button>
      </div>
    </form>
  );
}
