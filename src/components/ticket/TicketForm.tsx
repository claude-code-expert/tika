'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { TITLE_MAX_LENGTH, DESCRIPTION_MAX_LENGTH } from '@/lib/constants';
import type { CreateTicketInput, UpdateTicketInput, Ticket, TicketPriority } from '@/types';

interface TicketFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<Ticket>;
  onSubmit: (data: CreateTicketInput | UpdateTicketInput) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function TicketForm({
  mode,
  initialData = {},
  onSubmit,
  onCancel,
  isLoading = false,
}: TicketFormProps) {
  const [title, setTitle] = useState(initialData.title ?? '');
  const [description, setDescription] = useState(initialData.description ?? '');
  const [priority, setPriority] = useState<TicketPriority>(
    (initialData.priority as TicketPriority) ?? 'MEDIUM',
  );
  const [dueDate, setDueDate] = useState(initialData.dueDate ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = '제목을 입력해주세요';
    } else if (title.length > TITLE_MAX_LENGTH) {
      newErrors.title = `제목은 ${TITLE_MAX_LENGTH}자 이내로 입력해주세요`;
    }

    if (description && description.length > DESCRIPTION_MAX_LENGTH) {
      newErrors.description = `설명은 ${DESCRIPTION_MAX_LENGTH}자 이내로 입력해주세요`;
    }

    if (dueDate) {
      const today = new Date().toISOString().split('T')[0];
      if (dueDate < today) {
        newErrors.dueDate = '마감일은 오늘 이후여야 합니다';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const data: CreateTicketInput | UpdateTicketInput = {
      title: title.trim(),
      ...(description ? { description } : mode === 'edit' ? { description: null } : {}),
      priority,
      ...(dueDate ? { dueDate } : mode === 'edit' ? { dueDate: null } : {}),
    };

    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 제목 */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          제목 <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:ring-2 focus:outline-none ${
            errors.title ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
          }`}
          placeholder="할 일을 입력하세요"
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? 'title-error' : undefined}
          maxLength={TITLE_MAX_LENGTH}
        />
        {errors.title && (
          <p id="title-error" className="mt-1 text-xs text-red-600">{errors.title}</p>
        )}
      </div>

      {/* 설명 */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          설명
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:ring-2 focus:outline-none ${
            errors.description ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
          }`}
          placeholder="상세 설명을 입력하세요 (선택)"
          maxLength={DESCRIPTION_MAX_LENGTH}
        />
        {errors.description && (
          <p className="mt-1 text-xs text-red-600">{errors.description}</p>
        )}
      </div>

      {/* 우선순위 + 마감일 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
            우선순위
          </label>
          <select
            id="priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as TicketPriority)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </div>

        <div>
          <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
            마감일
          </label>
          <input
            id="dueDate"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:ring-2 focus:outline-none ${
              errors.dueDate ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
            }`}
          />
          {errors.dueDate && (
            <p className="mt-1 text-xs text-red-600">{errors.dueDate}</p>
          )}
        </div>
      </div>

      {/* 버튼 */}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {mode === 'create' ? '생성' : '저장'}
        </Button>
      </div>
    </form>
  );
}
