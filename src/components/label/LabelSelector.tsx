'use client';

import { useState } from 'react';
import type { Label } from '@/types/index';
import { LabelBadge } from './LabelBadge';
import { LABEL_MAX_PER_TICKET } from '@/lib/constants';

interface LabelSelectorProps {
  labels: Label[];
  selectedIds: number[];
  onToggle: (labelId: number) => void;
  onCreateLabel?: (name: string, color: string) => Promise<void>;
}

const PRESET_COLORS = [
  '#2b7fff', '#00c950', '#ad46ff', '#fb2c36', '#ffac6d',
  '#615fff', '#f59e0b', '#10b981', '#ef4444', '#6366f1',
];

export function LabelSelector({ labels, selectedIds, onToggle, onCreateLabel }: LabelSelectorProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [isCreating, setIsCreating] = useState(false);

  const isAtLimit = selectedIds.length >= LABEL_MAX_PER_TICKET;

  const handleCreate = async () => {
    if (!newName.trim() || !onCreateLabel) return;
    setIsCreating(true);
    try {
      await onCreateLabel(newName.trim(), newColor);
      setNewName('');
      setShowCreate(false);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-2">
      {isAtLimit && (
        <p className="text-xs text-orange-500">최대 {LABEL_MAX_PER_TICKET}개까지 선택 가능합니다</p>
      )}

      <div className="max-h-40 space-y-1 overflow-y-auto">
        {labels.map((label) => {
          const isSelected = selectedIds.includes(label.id);
          return (
            <label key={label.id} className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggle(label.id)}
                disabled={!isSelected && isAtLimit}
                className="h-3.5 w-3.5 rounded border-gray-300"
              />
              <LabelBadge label={label} size="sm" />
            </label>
          );
        })}
      </div>

      {onCreateLabel && (
        <div>
          {!showCreate ? (
            <button
              onClick={() => setShowCreate(true)}
              className="text-xs text-blue-500 hover:text-blue-700"
            >
              + 새 라벨 만들기
            </button>
          ) : (
            <div className="space-y-2 rounded-lg border border-gray-200 p-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="라벨명"
                maxLength={20}
                className="w-full rounded border border-gray-200 px-2 py-1 text-xs focus:outline-none"
                aria-label="새 라벨명"
              />
              <div className="flex flex-wrap gap-1">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setNewColor(color)}
                    className={`h-5 w-5 rounded-full transition ${newColor === color ? 'ring-2 ring-offset-1 ring-gray-400' : ''}`}
                    style={{ backgroundColor: color }}
                    aria-label={`색상 선택: ${color}`}
                  />
                ))}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setShowCreate(false)}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  취소
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!newName.trim() || isCreating}
                  className="rounded bg-blue-500 px-2 py-0.5 text-xs text-white hover:bg-blue-600 disabled:opacity-40"
                >
                  생성
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
