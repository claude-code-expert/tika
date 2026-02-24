'use client';

import { useState, useRef } from 'react';
import type { ChecklistItem } from '@/types/index';
import { CHECKLIST_MAX_ITEMS } from '@/lib/constants';

interface ChecklistSectionProps {
  items: ChecklistItem[];
  onAdd: (text: string) => Promise<void>;
  onToggle: (itemId: number, isCompleted: boolean) => Promise<void>;
  onDelete: (itemId: number) => Promise<void>;
}

export function ChecklistSection({
  items,
  onAdd,
  onToggle,
  onDelete,
}: ChecklistSectionProps) {
  const [newText, setNewText] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const completedCount = items.filter((i) => i.isCompleted).length;
  const isAtLimit = items.length >= CHECKLIST_MAX_ITEMS;

  const handleAdd = async () => {
    if (!newText.trim()) return;
    setIsAdding(true);
    try {
      await onAdd(newText.trim());
      setNewText('');
      inputRef.current?.focus();
    } finally {
      setIsAdding(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">체크리스트</h3>
        {items.length > 0 && (
          <span className="text-xs text-gray-400">
            {completedCount}/{items.length}
          </span>
        )}
      </div>

      {/* Progress bar */}
      {items.length > 0 && (
        <div className="mb-3 h-1.5 rounded-full bg-gray-100">
          <div
            className="h-1.5 rounded-full bg-blue-500 transition-all"
            style={{ width: `${(completedCount / items.length) * 100}%` }}
          />
        </div>
      )}

      {/* Items */}
      <ul className="mb-2 space-y-1">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={item.isCompleted}
              onChange={(e) => onToggle(item.id, e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600"
              aria-label={item.text}
            />
            <span
              className={`flex-1 text-sm ${item.isCompleted ? 'text-gray-400 line-through' : 'text-gray-700'}`}
            >
              {item.text}
            </span>
            <button
              onClick={() => onDelete(item.id)}
              className="text-gray-300 hover:text-red-400"
              aria-label="항목 삭제"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </li>
        ))}
      </ul>

      {/* Input */}
      {isAtLimit ? (
        <p className="text-xs text-gray-400">최대 {CHECKLIST_MAX_ITEMS}개 제한</p>
      ) : (
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="항목 추가..."
            maxLength={200}
            className="flex-1 rounded border border-gray-200 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
            disabled={isAdding}
            aria-label="새 체크리스트 항목"
          />
          <button
            onClick={handleAdd}
            disabled={!newText.trim() || isAdding}
            className="rounded bg-blue-50 px-2 py-1 text-xs text-blue-600 hover:bg-blue-100 disabled:opacity-40"
          >
            추가
          </button>
        </div>
      )}
    </div>
  );
}
