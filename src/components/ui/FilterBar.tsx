'use client';

import type { Label } from '@/types/index';

interface FilterBarProps {
  labels?: Label[];
  activeLabels?: number[];
  onLabelToggle?: (labelId: number) => void;
  onClearLabels?: () => void;
}

export function FilterBar({ labels = [], activeLabels = [], onLabelToggle, onClearLabels }: FilterBarProps) {
  if (labels.length === 0) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-gray-500">필터:</span>
      <button
        onClick={onClearLabels}
        className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
          activeLabels.length === 0
            ? 'bg-blue-100 text-blue-700'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        전체
      </button>
      {labels.map((label) => (
        <button
          key={label.id}
          onClick={() => onLabelToggle?.(label.id)}
          className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition`}
          style={
            activeLabels.includes(label.id)
              ? { backgroundColor: label.color, color: '#fff' }
              : { backgroundColor: label.color + '22', color: label.color }
          }
        >
          {label.name}
        </button>
      ))}
    </div>
  );
}
