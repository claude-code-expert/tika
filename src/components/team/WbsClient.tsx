'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { GanttChart } from '@/components/team/GanttChart';
import { TicketModal } from '@/components/ticket/TicketModal';
import type { GanttItem } from '@/components/team/GanttChart';
import type { TicketWithMeta } from '@/types/index';
import type { UpdateTicketInput } from '@/lib/validations';

export interface WbsStats {
  goal: number;
  story: number;
  feature: number;
  task: number;
  overallPct: number;
}

interface WbsClientProps {
  allItems: GanttItem[];
  allTickets: TicketWithMeta[];
  stats: WbsStats;
  currentMemberId: number | null;
  workspaceName: string;
}

const LEGEND = [
  { label: '완료',   bg: '#86EFAC', border: '#22C55E' },
  { label: '진행중', bg: '#FCD34D', border: '#F59E0B' },
  { label: '예정',   bg: '#93C5FD', border: '#3B82F6' },
  { label: '미시작', bg: '#E5E7EB', border: '#D1D5DB' },
  { label: '지연',   bg: '#FCA5A5', border: '#EF4444' },
];

function getAllDates(items: GanttItem[]): string[] {
  const dates: string[] = [];
  for (const item of items) {
    if (item.startDate) dates.push(item.startDate);
    if (item.endDate)   dates.push(item.endDate);
    if (item.children)  dates.push(...getAllDates(item.children));
  }
  return dates;
}

function getDateRange(items: GanttItem[]): { start: string; end: string } {
  const dates = getAllDates(items).sort();
  if (dates.length === 0) {
    const t = new Date().toISOString().slice(0, 10);
    return { start: t, end: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10) };
  }
  const s = new Date(dates[0]);
  s.setDate(s.getDate() - 3);
  const e = new Date(dates[dates.length - 1]);
  e.setDate(e.getDate() + 7);
  return { start: s.toISOString().slice(0, 10), end: e.toISOString().slice(0, 10) };
}

function getActualDateRange(items: GanttItem[]): { start: string | null; end: string | null } {
  const dates = getAllDates(items).sort();
  if (dates.length === 0) return { start: null, end: null };
  return { start: dates[0], end: dates[dates.length - 1] };
}

function countItems(items: GanttItem[]): { total: number; done: number } {
  let total = 0, done = 0;
  for (const item of items) {
    total++;
    if (item.status === 'DONE') done++;
    if (item.children) {
      const sub = countItems(item.children);
      total += sub.total;
      done  += sub.done;
    }
  }
  return { total, done };
}

export function WbsClient({ allItems, allTickets, stats, currentMemberId, workspaceName }: WbsClientProps) {
  const router = useRouter();
  const goals  = allItems.filter((item) => item.type === 'GOAL');

  const [selectedGoalId, setSelectedGoalId] = useState<number | 'all'>('all');
  const [activeTicket,   setActiveTicket]   = useState<TicketWithMeta | null>(null);

  const filteredItems =
    selectedGoalId === 'all'
      ? allItems
      : allItems.filter((item) => item.id === selectedGoalId && item.type === 'GOAL');

  const dateRange    = getDateRange(filteredItems.length > 0 ? filteredItems : allItems);
  const selectedGoal = selectedGoalId === 'all' ? null : goals.find((g) => g.id === selectedGoalId) ?? null;
  const goalCounts   = selectedGoal ? countItems([selectedGoal]) : null;
  const goalPct      = goalCounts && goalCounts.total > 0 ? Math.round((goalCounts.done / goalCounts.total) * 100) : 0;
  const goalDates    = selectedGoal ? getActualDateRange([selectedGoal]) : null;

  // All types (GOAL/STORY/FEATURE/TASK) → TicketModal
  const handleItemClick = useCallback((item: GanttItem) => {
    const ticket = allTickets.find((t) => t.id === item.id);
    if (ticket) setActiveTicket(ticket);
  }, [allTickets]);

  const handleUpdate = useCallback(async (id: number, data: UpdateTicketInput) => {
    await fetch(`/api/tickets/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    router.refresh();
  }, [router]);

  const handleDelete = useCallback(async (id: number) => {
    await fetch(`/api/tickets/${id}`, { method: 'DELETE' });
    setActiveTicket(null);
    router.refresh();
  }, [router]);

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        fontFamily: "'Plus Jakarta Sans', 'Noto Sans KR', sans-serif",
      }}
    >
      {/* ── Summary stats (5 cards) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
        {[
          { label: 'Goal',     value: stats.goal,       color: '#4338CA' },
          { label: 'Story',    value: stats.story,      color: '#1D4ED8' },
          { label: 'Feature',  value: stats.feature,    color: '#065F46' },
          { label: 'Task',     value: stats.task,       color: '#6B7280' },
          { label: '전체 완료율', value: `${stats.overallPct}%`, color: '#629584' },
        ].map((s) => (
          <div
            key={s.label}
            style={{ background: '#fff', border: '1px solid #DFE1E6', borderRadius: 8, padding: '12px 16px', boxShadow: '0 1px 3px rgba(0,0,0,.04)', textAlign: 'center' }}
          >
            <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#8993A4', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Gantt card ── */}
      <div style={{ background: '#fff', border: '1px solid #DFE1E6', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,.04)',  }}>

        {/* Toolbar */}
        <div style={{ padding: '10px 16px', borderBottom: '1px solid #DFE1E6', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', background: '#fff' }}>
          {/* Goal select */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#5A6B7F' }}>Goal 선택</span>
            <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
              <select
                value={selectedGoalId === 'all' ? 'all' : String(selectedGoalId)}
                onChange={(e) => setSelectedGoalId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                style={{ height: 34, paddingLeft: 12, paddingRight: 32, fontFamily: 'inherit', fontSize: 12, fontWeight: 600, color: '#2C3E50', background: '#F8F9FB', border: '1px solid #DFE1E6', borderRadius: 6, cursor: 'pointer', outline: 'none', appearance: 'none', WebkitAppearance: 'none', transition: 'border-color .15s' }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#629584')}
                onBlur={(e)  => (e.currentTarget.style.borderColor = '#DFE1E6')}
              >
                <option value="all">전체 Goal</option>
                {goals.map((g) => (
                  <option key={g.id} value={String(g.id)}>{g.name}</option>
                ))}
              </select>
              <span style={{ position: 'absolute', right: 10, pointerEvents: 'none', color: '#5A6B7F', fontSize: 10 }}>▾</span>
            </div>
          </div>

          {/* Legend */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
            {LEGEND.map((leg) => (
              <div key={leg.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 12, height: 12, borderRadius: 2, background: leg.bg, border: `1px solid ${leg.border}`, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: '#5A6B7F' }}>{leg.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Goal info banner */}
        {selectedGoal && goalCounts && (
          <div style={{ padding: '8px 16px', background: 'rgba(224,231,255,.18)', borderBottom: '1px solid #DFE1E6', display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 3, background: '#E0E7FF', color: '#4338CA' }}>G</span>
              <span style={{ fontWeight: 600, color: '#2C3E50' }}>{selectedGoal.name}</span>
            </div>
            {goalDates?.start && (
              <span style={{ color: '#5A6B7F' }}>기간: <strong style={{ color: '#2C3E50' }}>{goalDates.start} ~ {goalDates.end}</strong></span>
            )}
            <span style={{ color: '#5A6B7F' }}>항목: <strong style={{ color: '#2C3E50' }}>{goalCounts.total}개</strong></span>
            <span style={{ color: '#5A6B7F' }}>완료: <strong style={{ color: '#2C3E50' }}>{goalCounts.done}개</strong></span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <strong style={{ color: '#2C3E50' }}>{goalPct}%</strong>
              <div style={{ width: 80, height: 6, background: '#DFE1E6', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${goalPct}%`, height: '100%', background: '#629584', borderRadius: 3 }} />
              </div>
            </div>
          </div>
        )}

        {/* Gantt chart */}
        <GanttChart items={filteredItems} dateRange={dateRange} onItemClick={handleItemClick} />
      </div>

      {/* ── Ticket detail modal (all types: GOAL/STORY/FEATURE/TASK) ── */}
      {activeTicket && (
        <TicketModal
          ticket={activeTicket}
          isOpen={true}
          onClose={() => setActiveTicket(null)}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          currentMemberId={currentMemberId}
          workspaceName={workspaceName}
        />
      )}
    </div>
  );
}
