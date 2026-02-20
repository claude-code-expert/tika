'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { TicketCard } from './TicketCard';
import { COLUMN_COLORS } from '@/lib/constants';
import { COLUMN_LABELS } from '@/types';
import type { TicketStatus, TicketWithMeta } from '@/types';

interface ColumnProps {
  status: TicketStatus;
  tickets: TicketWithMeta[];
  onTicketClick: (ticket: TicketWithMeta) => void;
}

export function Column({ status, tickets, onTicketClick }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[200px] flex-col rounded-xl border-2 p-3 transition-colors ${COLUMN_COLORS[status]} ${
        isOver ? 'border-blue-400 bg-blue-50/50' : ''
      }`}
    >
      {/* 칼럼 헤더 */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700">{COLUMN_LABELS[status]}</h2>
        <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gray-200 px-1.5 text-xs font-medium text-gray-600">
          {tickets.length}
        </span>
      </div>

      {/* 카드 목록 */}
      <SortableContext items={tickets.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-1 flex-col gap-2">
          {tickets.length === 0 ? (
            <p className="py-8 text-center text-xs text-gray-400">이 칼럼에 티켓이 없습니다</p>
          ) : (
            tickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} onClick={() => onTicketClick(ticket)} />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}
