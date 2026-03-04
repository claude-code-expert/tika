'use client';

import { useRouter } from 'next/navigation';
import type { Sprint } from '@/types/index';

interface SprintSelectorProps {
  sprints: Sprint[];
  selectedSprintId?: number;
  workspaceId: number;
  basePath: string; // e.g. 'burndown' or 'wbs'
}

export function SprintSelector({ sprints, selectedSprintId, workspaceId, basePath }: SprintSelectorProps) {
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val) {
      router.push(`/team/${workspaceId}/${basePath}?sprintId=${val}`);
    } else {
      router.push(`/team/${workspaceId}/${basePath}`);
    }
  };

  if (sprints.length === 0) return null;

  return (
    <select
      value={selectedSprintId ?? ''}
      onChange={handleChange}
      style={{
        padding: '7px 12px',
        borderRadius: 7,
        border: '1px solid #DFE1E6',
        fontSize: 13,
        color: '#374151',
        background: '#fff',
        outline: 'none',
        cursor: 'pointer',
        minWidth: 160,
      }}
    >
      <option value="">스프린트 선택</option>
      {sprints.map((s) => (
        <option key={s.id} value={s.id}>
          {s.name} ({s.status === 'ACTIVE' ? '활성' : s.status === 'COMPLETED' ? '완료' : '계획'})
        </option>
      ))}
    </select>
  );
}
