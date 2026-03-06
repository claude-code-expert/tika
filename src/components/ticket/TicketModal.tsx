'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ChecklistSection } from './ChecklistSection';
import type { TicketWithMeta, ChecklistItem, Label, Issue, Member, Comment } from '@/types/index';
import { TICKET_STATUS, TICKET_PRIORITY, TICKET_TYPE } from '@/types/index';
import type { UpdateTicketInput } from '@/lib/validations';
import { TICKET_TYPE_META } from '@/lib/constants';
import { PRIORITY_CONFIG } from '@/components/ui/Chips';
import { LabelBadge, labelTextColor } from '@/components/label/LabelBadge';
import {
  FileText,
  Users,
  UserPlus,
  Save,
  CopyPlus,
  X,
  Trash2,
} from 'lucide-react';

// ─── style helpers ────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  BACKLOG: { bg: '#F1F3F6', color: '#5A6B7F' },
  TODO: { bg: '#DBEAFE', color: '#1E40AF' },
  IN_PROGRESS: { bg: '#FEF3C7', color: '#92400E' },
  DONE: { bg: '#D1FAE5', color: '#065F46' },
};

const TYPE_BADGE_STYLES: Record<string, { bg: string; color: string }> = {
  GOAL: { bg: '#EDE9FE', color: '#6D28D9' },
  STORY: { bg: '#DBEAFE', color: '#1D4ED8' },
  FEATURE: { bg: '#D1FAE5', color: '#065F46' },
  TASK: { bg: '#FEF3C7', color: '#92400E' },
};

// ─── constants ─────────────────────────────────────────────────────────────────

const CHEVRON_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%239CA3AF' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round' fill='none'/%3E%3C/svg%3E") no-repeat right 6px center`;


// ─── types ────────────────────────────────────────────────────────────────────

interface TicketModalProps {
  ticket: TicketWithMeta;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: number, data: UpdateTicketInput) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onDuplicate?: () => Promise<void>;
  currentMemberId?: number | null;
  workspaceName?: string;
}

// ─── component ────────────────────────────────────────────────────────────────

export function TicketModal({
  ticket,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  onDuplicate,
  workspaceName,
}: TicketModalProps) {
  // ── editable state ──
  const [title, setTitle] = useState(ticket.title);
  const [description, setDescription] = useState(ticket.description ?? '');
  const [status, setStatus] = useState(ticket.status);
  const [priority, setPriority] = useState(ticket.priority);
  const [type, setType] = useState(ticket.type);
  const [startDate, setStartDate] = useState(ticket.startDate ?? '');
  const [dueDate, setDueDate] = useState(ticket.dueDate ?? '');
  const [selectedIssueId, setSelectedIssueId] = useState<number | null>(ticket.issueId ?? null);
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<number[]>(() => {
    const ids = new Set(ticket.assignees.map((a) => a.id));
    if (ticket.assignee) ids.add(ticket.assignee.id);
    return [...ids];
  });
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>(ticket.checklistItems);
  const [commentList, setCommentList] = useState<Comment[]>([]);

  // ── label state ──
  const [allLabels, setAllLabels] = useState<Label[]>([]);
  const [selectedLabelIds, setSelectedLabelIds] = useState<number[]>(
    ticket.labels.map((l) => l.id),
  );
  const [labelsLoaded, setLabelsLoaded] = useState(false);
  const [showLabelPicker, setShowLabelPicker] = useState(false);

  // ── issue / member state ──
  const [allIssues, setAllIssues] = useState<Issue[]>([]);
  const [allMembers, setAllMembers] = useState<Member[]>([]);

  // ── UI state ──
  const [isSaving, setIsSaving] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showAssigneePicker, setShowAssigneePicker] = useState(false);
  const [assigneeSearch, setAssigneeSearch] = useState('');
  const [assigneeSearched, setAssigneeSearched] = useState(false);

  // ── refs ──
  const titleTextareaRef = useRef<HTMLTextAreaElement>(null);
  const labelAreaRef = useRef<HTMLDivElement>(null);
  const assigneeAreaRef = useRef<HTMLDivElement>(null);

  // ── auto-resize title textarea ──
  const autoResizeTitle = useCallback(() => {
    const el = titleTextareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }, []);

  useEffect(() => {
    autoResizeTitle();
  }, [title, autoResizeTitle]);

  // ── fetch issues, members, comments ──
  useEffect(() => {
    Promise.all([
      fetch('/api/issues').then((r) => (r.ok ? r.json() : null)),
      fetch('/api/members').then((r) => (r.ok ? r.json() : null)),
      fetch(`/api/tickets/${ticket.id}/comments`).then((r) => (r.ok ? r.json() : null)),
    ]).then(([issuesData, membersData, commentsData]) => {
      if (issuesData?.issues) setAllIssues(issuesData.issues);
      if (membersData?.members) setAllMembers(membersData.members);
      if (commentsData?.comments) setCommentList(commentsData.comments);
    });
  }, [ticket.id]);

  // ── outside click: label picker ──
  useEffect(() => {
    if (!showLabelPicker) return;
    const handleClick = (e: MouseEvent) => {
      if (labelAreaRef.current && !labelAreaRef.current.contains(e.target as Node)) {
        setShowLabelPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showLabelPicker]);

  // ── outside click: assignee picker ──
  useEffect(() => {
    if (!showAssigneePicker) return;
    const handleClick = (e: MouseEvent) => {
      if (assigneeAreaRef.current && !assigneeAreaRef.current.contains(e.target as Node)) {
        setShowAssigneePicker(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showAssigneePicker]);

  // ── dirty check ──
  const isDirty =
    title !== ticket.title ||
    description !== (ticket.description ?? '') ||
    status !== ticket.status ||
    priority !== ticket.priority ||
    type !== ticket.type ||
    startDate !== (ticket.startDate ?? '') ||
    dueDate !== (ticket.dueDate ?? '') ||
    selectedIssueId !== (ticket.issueId ?? null) ||
    JSON.stringify([...selectedAssigneeIds].sort()) !==
      JSON.stringify([...ticket.assignees.map((a) => a.id)].sort());

  // ── save ──
  const handleSave = async () => {
    if (!title.trim()) return;
    setIsSaving(true);
    try {
      const patch: UpdateTicketInput = {};
      if (title !== ticket.title) patch.title = title.trim();
      if (description !== (ticket.description ?? '')) patch.description = description || null;
      if (status !== ticket.status) patch.status = status;
      if (priority !== ticket.priority) patch.priority = priority;
      if (type !== ticket.type) patch.type = type;
      if (startDate !== (ticket.startDate ?? '')) patch.startDate = startDate || null;
      if (dueDate !== (ticket.dueDate ?? '')) patch.dueDate = dueDate || null;
      if (selectedIssueId !== (ticket.issueId ?? null)) patch.issueId = selectedIssueId;
      const origIds = [...ticket.assignees.map((a) => a.id)].sort().join(',');
      const newIds = [...selectedAssigneeIds].sort().join(',');
      if (origIds !== newIds) patch.assigneeIds = selectedAssigneeIds;
      await onUpdate(ticket.id, patch);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  // ── delete ──
  const handleDelete = async () => {
    await onDelete(ticket.id);
    setShowDelete(false);
    onClose();
  };

  // ── label helpers ──
  const handleLabelToggle = async (labelId: number) => {
    const newIds = selectedLabelIds.includes(labelId)
      ? selectedLabelIds.filter((id) => id !== labelId)
      : [...selectedLabelIds, labelId];
    setSelectedLabelIds(newIds);
    await fetch(`/api/tickets/${ticket.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ labelIds: newIds }),
    });
  };

  const handleLabelAddClick = async () => {
    if (!labelsLoaded) {
      const res = await fetch('/api/labels');
      if (res.ok) {
        const data = await res.json();
        setAllLabels(data.labels);
        setLabelsLoaded(true);
      }
    }
    setShowLabelPicker((prev) => !prev);
  };

  // ── assignee helpers ──
  const removeAssignee = (memberId: number) => {
    setSelectedAssigneeIds((prev) => prev.filter((id) => id !== memberId));
  };

  const addAssignee = (memberId: number) => {
    setSelectedAssigneeIds((prev) => (prev.includes(memberId) ? prev : [...prev, memberId]));
    setShowAssigneePicker(false);
  };

  // ── derived values ──
  const displayLabels: Label[] = labelsLoaded
    ? allLabels.filter((l) => selectedLabelIds.includes(l.id))
    : ticket.labels.filter((l) => selectedLabelIds.includes(l.id));

  const currentAssignees = allMembers.filter((m) => selectedAssigneeIds.includes(m.id));
  const unassignedMembers = allMembers.filter((m) => !selectedAssigneeIds.includes(m.id));

  const typeMeta = TICKET_TYPE_META[type];
  const typeBadgeStyle = TYPE_BADGE_STYLES[type];
  const statusStyle = STATUS_STYLES[status] ?? STATUS_STYLES.TODO;
  const priorityStyle = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.MEDIUM;
  const completedItems = checklistItems.filter((i) => i.isCompleted).length;
  const totalItems = checklistItems.length;
  const clPct = totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100);

  // ── icon button styles ──
  const iconBtnBase: React.CSSProperties = {
    width: 32,
    height: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    borderRadius: 6,
    background: 'transparent',
    color: 'var(--color-text-muted)',
    cursor: 'pointer',
    transition: 'background 0.15s, color 0.15s',
    flexShrink: 0,
  };

  const footerBtnBase: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    height: 30,
    padding: '0 12px',
    borderRadius: 6,
    fontFamily: 'inherit',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s',
    whiteSpace: 'nowrap',
  };

  const metaSelectStyle: React.CSSProperties = {
    width: '100%',
    height: 28,
    padding: '0 24px 0 8px',
    border: '1px solid var(--color-border)',
    borderRadius: 6,
    fontFamily: 'inherit',
    fontSize: 12,
    color: 'var(--color-text-primary)',
    background: `var(--color-board-bg) ${CHEVRON_SVG}`,
    outline: 'none',
    cursor: 'pointer',
    appearance: 'none',
    WebkitAppearance: 'none',
  };

  const metaDateStyle: React.CSSProperties = {
    width: '100%',
    height: 28,
    padding: '0 8px',
    border: '1px solid var(--color-border)',
    borderRadius: 6,
    fontFamily: 'inherit',
    fontSize: 12,
    color: 'var(--color-text-primary)',
    background: 'var(--color-board-bg)',
    outline: 'none',
    cursor: 'pointer',
  };

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        maxWidth={800}
        height="800px"
        maxHeight="800px"
        headerPadding="6px 20px"
        hideCloseButton
        headerContent={
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
            }}
          >
            {/* Left: ticket ID + type badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--color-accent)',
                  background: 'var(--color-accent-light, #E8F5F0)',
                  padding: '3px 8px',
                  borderRadius: 4,
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.3px',
                }}
              >
                {workspaceName ?? 'TKT'}-{ticket.id}
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  height: 22,
                  padding: '0 8px',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.3px',
                  background: typeBadgeStyle.bg,
                  color: typeBadgeStyle.color,
                  whiteSpace: 'nowrap',
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 14,
                    height: 14,
                    borderRadius: 3,
                    background: typeMeta.bg,
                    color: '#fff',
                    fontSize: 9,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {typeMeta.abbr}
                </span>
                {typeMeta.label}
              </span>
            </div>

            {/* Right: icon action buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {/* Duplicate */}
              <button
                style={iconBtnBase}
                title="복제"
                aria-label="복제"
                onClick={
                  onDuplicate
                    ? async () => {
                        setIsSaving(true);
                        try {
                          await onDuplicate();
                          onClose();
                        } finally {
                          setIsSaving(false);
                        }
                      }
                    : undefined
                }
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--color-board-bg)';
                  e.currentTarget.style.color = 'var(--color-text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--color-text-muted)';
                }}
              >
                <CopyPlus size={15} />
              </button>

              {/* Delete */}
              <button
                style={iconBtnBase}
                title="삭제"
                aria-label="삭제"
                onClick={() => setShowDelete(true)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#FEF2F2';
                  e.currentTarget.style.color = '#DC2626';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--color-text-muted)';
                }}
              >
                <Trash2 size={15} />
              </button>

              {/* Close */}
              <button
                style={iconBtnBase}
                title="닫기"
                aria-label="닫기"
                onClick={onClose}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--color-board-bg)';
                  e.currentTarget.style.color = 'var(--color-text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--color-text-muted)';
                }}
              >
                <X size={16} />
              </button>
            </div>
          </div>
        }
      >
        {/* ══════════ outer flex column ══════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>

          {/* ══════════ scrollable area (title + two-column grid) ══════════ */}
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>

            {/* ── TITLE SECTION ── */}
            <div
              style={{
                padding: '10px 24px 10px',
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              {/* Auto-resize title textarea */}
              <textarea
                ref={titleTextareaRef}
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                }}
                onInput={autoResizeTitle}
                maxLength={200}
                rows={1}
                aria-label="제목"
                style={{
                  width: 'calc(100% + 16px)',
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontFamily: "'Plus Jakarta Sans', 'Noto Sans KR', sans-serif",
                  fontSize: 19,
                  fontWeight: 700,
                  color: 'var(--color-text-primary)',
                  lineHeight: 1.45,
                  resize: 'none',
                  overflow: 'hidden',
                  cursor: 'text',
                  padding: '6px 8px',
                  margin: '0 -8px',
                  borderRadius: 6,
                  display: 'block',
                }}
                onFocus={(e) => {
                  e.target.style.background = 'var(--color-board-bg)';
                }}
                onBlur={(e) => {
                  e.target.style.background = 'transparent';
                }}
              />

              {/* Breadcrumb — select box */}
              {ticket.type !== 'GOAL' && (
                <div style={{ marginTop: 6 }}>
                  <select
                    value={selectedIssueId ?? ''}
                    onChange={(e) => setSelectedIssueId(e.target.value ? Number(e.target.value) : null)}
                    aria-label="상위 이슈 선택"
                    style={{
                      padding: '4px 10px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 500,
                      background: 'var(--color-board-bg)',
                      color: 'var(--color-text-primary)',
                      border: '1px solid var(--color-border)',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      outline: 'none',
                      maxWidth: 320,
                    }}
                  >
                    <option value="">상위 이슈 없음</option>
                    {allIssues
                      .filter((issue) => {
                        if (ticket.type === 'STORY') return issue.type === 'GOAL';
                        if (ticket.type === 'FEATURE') return issue.type === 'STORY';
                        if (ticket.type === 'TASK') return issue.type === 'FEATURE';
                        return false;
                      })
                      .map((issue) => (
                        <option key={issue.id} value={issue.id}>
                          [{issue.type.charAt(0)}] {issue.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>
            {/* ── end TITLE SECTION ── */}

            {/* ══════════ TWO-COLUMN GRID ══════════ */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 180px',
              }}
            >
              {/* ── LEFT: content area ── */}
              <div
                style={{
                  padding: '20px 24px',
                  borderRight: '1px solid var(--color-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 24,
                  minHeight: 380,
                }}
              >
                {/* 설명 section */}
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'var(--color-text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.6px',
                      marginBottom: 10,
                    }}
                  >
                    <FileText size={13} style={{ opacity: 0.7 }} />
                    설명
                  </div>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={1000}
                    rows={4}
                    placeholder="티켓에 대한 설명을 입력하세요..."
                    aria-label="설명"
                    style={{
                      width: '100%',
                      minHeight: 80,
                      padding: '10px 14px',
                      border: '1px solid var(--color-border)',
                      borderRadius: 8,
                      fontFamily: 'inherit',
                      fontSize: 14,
                      color: 'var(--color-text-primary)',
                      lineHeight: 1.7,
                      background: 'var(--color-board-bg)',
                      resize: 'vertical',
                      outline: 'none',
                      transition: 'border-color 0.15s, box-shadow 0.15s',
                    }}
                    onFocus={(e) => {
                      e.target.style.background = '#fff';
                      e.target.style.borderColor = 'var(--color-accent)';
                      e.target.style.boxShadow = '0 0 0 3px var(--color-accent-light, #E8F5F0)';
                    }}
                    onBlur={(e) => {
                      e.target.style.background = 'var(--color-board-bg)';
                      e.target.style.borderColor = 'var(--color-border)';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>

                {/* Labels section */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <button
                    onClick={handleLabelAddClick}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 3,
                      padding: '2px 6px',
                      border: '1px dashed #9CA3AF',
                      borderRadius: 4,
                      background: 'transparent',
                      fontSize: 10,
                      fontWeight: 600,
                      color: 'var(--color-text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      fontFamily: 'inherit',
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-accent)';
                      e.currentTarget.style.color = 'var(--color-accent)';
                      e.currentTarget.style.background = 'var(--color-accent-light, #E8F5F0)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#9CA3AF';
                      e.currentTarget.style.color = 'var(--color-text-muted)';
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    + 라벨 추가
                  </button>
                  <div
                    ref={labelAreaRef}
                    style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 4, position: 'relative', minHeight: 20 }}
                  >
                    {displayLabels.map((label) => (
                      <LabelBadge
                        key={label.id}
                        label={label}
                        size="sm"
                        onRemove={() => handleLabelToggle(label.id)}
                      />
                    ))}
                    {/* Label picker dropdown */}
                    {showLabelPicker && labelsLoaded && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 'calc(100% + 4px)',
                          left: 0,
                          background: '#fff',
                          border: '1px solid var(--color-border)',
                          borderRadius: 8,
                          boxShadow: 'var(--shadow-dropdown)',
                          padding: '10px 12px',
                          zIndex: 200,
                          minWidth: 180,
                        }}
                      >
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 8 }}>
                          라벨 선택
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                          {allLabels.map((label) => {
                            const isUsed = selectedLabelIds.includes(label.id);
                            return (
                              <button
                                key={label.id}
                                onClick={() => {
                                  if (!isUsed) {
                                    handleLabelToggle(label.id);
                                    setShowLabelPicker(false);
                                  }
                                }}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  height: 22,
                                  padding: '0 10px',
                                  borderRadius: 11,
                                  fontSize: 11,
                                  fontWeight: 500,
                                  cursor: isUsed ? 'default' : 'pointer',
                                  border: isUsed ? `2px solid ${label.color}` : '2px solid transparent',
                                  background: label.color,
                                  color: labelTextColor(label.color),
                                  fontFamily: 'inherit',
                                  opacity: isUsed ? 0.4 : 1,
                                  transition: 'opacity 0.12s',
                                  pointerEvents: isUsed ? 'none' : 'auto',
                                }}
                              >
                                {label.name}
                              </button>
                            );
                          })}
                          {allLabels.length === 0 && (
                            <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>라벨이 없습니다</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 체크리스트 section */}
                <div>
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
                      setChecklistItems((prev) =>
                        prev.map((i) => (i.id === itemId ? { ...i, isCompleted } : i)),
                      );
                      const res = await fetch(`/api/tickets/${ticket.id}/checklist/${itemId}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ isCompleted }),
                      });
                      if (!res.ok) {
                        setChecklistItems((prev) =>
                          prev.map((i) =>
                            i.id === itemId ? { ...i, isCompleted: !isCompleted } : i,
                          ),
                        );
                      }
                    }}
                    onDelete={async (itemId) => {
                      const snapshot = checklistItems;
                      setChecklistItems((prev) => prev.filter((i) => i.id !== itemId));
                      const res = await fetch(`/api/tickets/${ticket.id}/checklist/${itemId}`, {
                        method: 'DELETE',
                      });
                      if (!res.ok) {
                        setChecklistItems(snapshot);
                      }
                    }}
                  />
                </div>

                {/* 담당자 section */}
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'var(--color-text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.6px',
                      marginBottom: 8,
                    }}
                  >
                    <Users size={13} style={{ opacity: 0.7 }} />
                    담당자
                  </div>
                  <div ref={assigneeAreaRef} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8 }}>
                    {/* Add assignee: button or input (left) */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      {!showAssigneePicker ? (
                        <button
                          onClick={() => { setShowAssigneePicker(true); setAssigneeSearch(''); }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '5px 10px',
                            borderRadius: 6,
                            border: '1px dashed #9CA3AF',
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                            fontSize: 12,
                            color: 'var(--color-text-muted)',
                            background: 'transparent',
                            fontFamily: 'inherit',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'var(--color-accent)';
                            e.currentTarget.style.color = 'var(--color-accent)';
                            e.currentTarget.style.background = 'var(--color-accent-light, #E8F5F0)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#9CA3AF';
                            e.currentTarget.style.color = 'var(--color-text-muted)';
                            e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          <UserPlus size={12} />
                          담당자 추가
                        </button>
                      ) : (
                        <div>
                          <input
                            type="text"
                            value={assigneeSearch}
                            onChange={(e) => { setAssigneeSearch(e.target.value); setAssigneeSearched(false); }}
                            placeholder="이름으로 검색..."
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Escape') { setShowAssigneePicker(false); setAssigneeSearch(''); setAssigneeSearched(false); }
                              if (e.key === 'Enter' && assigneeSearch.length >= 2) { setAssigneeSearched(true); }
                            }}
                            style={{
                              width: 140,
                              padding: '5px 10px',
                              border: '1px solid var(--color-accent)',
                              borderRadius: 6,
                              fontSize: 12,
                              fontFamily: 'inherit',
                              color: 'var(--color-text-primary)',
                              background: '#fff',
                              outline: 'none',
                              boxShadow: '0 0 0 3px var(--color-accent-light, #E8F5F0)',
                            }}
                          />
                          {/* Filtered member list */}
                          <div
                            style={{
                              position: 'absolute',
                              top: 'calc(100% + 4px)',
                              left: 0,
                              background: '#fff',
                              border: '1px solid var(--color-border)',
                              borderRadius: 8,
                              boxShadow: 'var(--shadow-dropdown)',
                              zIndex: 200,
                              padding: 4,
                              minWidth: 160,
                              maxHeight: 180,
                              overflowY: 'auto',
                            }}
                          >
                            {selectedAssigneeIds.length >= 3 ? (
                              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', padding: '6px 8px' }}>
                                모든 멤버가 배정됨
                              </p>
                            ) : !assigneeSearched ? (
                              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', padding: '6px 8px' }}>
                                2글자 이상 입력 후 Enter
                              </p>
                            ) : unassignedMembers.filter(m =>
                              m.displayName.toLowerCase().includes(assigneeSearch.toLowerCase())
                            ).length === 0 ? (
                              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', padding: '6px 8px' }}>
                                검색 결과 없음
                              </p>
                            ) : (
                              unassignedMembers
                                .filter(m => m.displayName.toLowerCase().includes(assigneeSearch.toLowerCase()))
                                .map((member) => (
                                  <button
                                    key={member.id}
                                    onMouseDown={(e) => { e.preventDefault(); addAssignee(member.id); setShowAssigneePicker(false); setAssigneeSearch(''); setAssigneeSearched(false); }}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 8,
                                      padding: '6px 8px',
                                      borderRadius: 6,
                                      border: 'none',
                                      background: 'transparent',
                                      width: '100%',
                                      cursor: 'pointer',
                                      fontFamily: 'inherit',
                                      transition: 'background 0.12s',
                                      textAlign: 'left',
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-board-bg)'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                                  >
                                    <span style={{
                                      width: 20, height: 20, borderRadius: '50%', background: member.color,
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      color: '#fff', fontSize: 9, fontWeight: 700, flexShrink: 0,
                                    }}>
                                      {member.displayName.charAt(0)}
                                    </span>
                                    <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-primary)' }}>
                                      {member.displayName}
                                    </span>
                                  </button>
                                ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Assignee chips — outlined, right-aligned */}
                    {currentAssignees.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, flex: 1, justifyContent: 'flex-end' }}>
                        {currentAssignees.map((member) => (
                          <span
                            key={member.id}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              height: 24,
                              padding: '0 8px',
                              borderRadius: 5,
                              background: 'transparent',
                              border: `1.5px solid ${member.color}`,
                              color: member.color,
                              fontSize: 11,
                              fontWeight: 600,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {member.displayName}
                            <button
                              onClick={() => removeAssignee(member.id)}
                              aria-label={`${member.displayName} 담당자 제거`}
                              style={{
                                width: 12,
                                height: 12,
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: 'none',
                                background: 'transparent',
                                color: 'inherit',
                                cursor: 'pointer',
                                fontSize: 10,
                                lineHeight: 1,
                                padding: 0,
                                opacity: 0.6,
                                transition: 'opacity 0.12s',
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.6'; }}
                            >×</button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

              </div>
              {/* ── end LEFT ── */}

              {/* ── RIGHT: meta panel ── */}
              <div
                style={{
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0,
                }}
              >
                {/* Status */}
                <MetaRow label="상태">
                  <select
                    value={status}
                    onChange={(e) =>
                      setStatus(
                        e.target.value as (typeof TICKET_STATUS)[keyof typeof TICKET_STATUS],
                      )
                    }
                    aria-label="상태"
                    style={{
                      ...metaSelectStyle,
                      background: `${statusStyle.bg} ${CHEVRON_SVG}`,
                      color: statusStyle.color,
                      fontWeight: 600,
                      border: 'none',
                    }}
                  >
                    {Object.values(TICKET_STATUS).map((s) => (
                      <option key={s} value={s}>
                        {s === 'BACKLOG' ? 'Backlog' :
                         s === 'TODO' ? 'To Do' :
                         s === 'IN_PROGRESS' ? 'In Progress' : 'Done'}
                      </option>
                    ))}
                  </select>
                </MetaRow>

                {/* Priority */}
                <MetaRow label="우선순위">
                  <select
                    value={priority}
                    onChange={(e) =>
                      setPriority(
                        e.target.value as (typeof TICKET_PRIORITY)[keyof typeof TICKET_PRIORITY],
                      )
                    }
                    aria-label="우선순위"
                    style={{
                      ...metaSelectStyle,
                      background: `${priorityStyle.bg} ${CHEVRON_SVG}`,
                      color: priorityStyle.color,
                      fontWeight: 600,
                      border: 'none',
                    }}
                  >
                    {Object.values(TICKET_PRIORITY).map((p) => {
                      const cfg = PRIORITY_CONFIG[p];
                      return (
                        <option key={p} value={p}>
                          {cfg.icon} {cfg.label}
                        </option>
                      );
                    })}
                  </select>
                </MetaRow>

                {/* Type */}
                <MetaRow label="유형">
                  <select
                    value={type}
                    onChange={(e) =>
                      setType(e.target.value as (typeof TICKET_TYPE)[keyof typeof TICKET_TYPE])
                    }
                    aria-label="유형"
                    style={metaSelectStyle}
                  >
                    {Object.values(TICKET_TYPE).map((t) => (
                      <option key={t} value={t}>
                        {t === 'GOAL' ? 'Goal' :
                         t === 'STORY' ? 'Story' :
                         t === 'FEATURE' ? 'Feature' : 'Task'}
                      </option>
                    ))}
                  </select>
                </MetaRow>

                {/* Start date */}
                <MetaRow label="시작 예정일">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    aria-label="시작 예정일"
                    style={metaDateStyle}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'var(--color-accent)';
                      e.target.style.background = '#fff';
                      e.target.style.boxShadow = '0 0 0 3px var(--color-accent-light, #E8F5F0)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'var(--color-border)';
                      e.target.style.background = 'var(--color-board-bg)';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </MetaRow>

                {/* Due date */}
                <MetaRow label="종료 예정일">
                  <div style={{ width: '100%', position: 'relative' }}>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      aria-label="종료 예정일"
                      style={{
                        ...metaDateStyle,
                        color: ticket.isOverdue ? '#DC2626' : 'var(--color-text-primary)',
                        borderColor: ticket.isOverdue ? '#FECACA' : 'var(--color-border)',
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = 'var(--color-accent)';
                        e.target.style.background = '#fff';
                        e.target.style.boxShadow = '0 0 0 3px var(--color-accent-light, #E8F5F0)';
                        e.target.style.color = 'var(--color-text-primary)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = ticket.isOverdue ? '#FECACA' : 'var(--color-border)';
                        e.target.style.background = 'var(--color-board-bg)';
                        e.target.style.boxShadow = 'none';
                        e.target.style.color = ticket.isOverdue ? '#DC2626' : 'var(--color-text-primary)';
                      }}
                    />
                    {ticket.isOverdue && (
                      <span
                        style={{
                          display: 'block',
                          fontSize: 10,
                          color: '#DC2626',
                          marginTop: 2,
                        }}
                      >
                        마감 초과
                      </span>
                    )}
                  </div>
                </MetaRow>

                {/* Summary section */}
                <div
                  style={{
                    marginTop: 8,
                    paddingTop: 12,
                    borderTop: '1px solid var(--color-border)',
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: 'var(--color-text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: 10,
                    }}
                  >
                    요약
                  </div>

                  {/* Checklist progress */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 6,
                    }}
                  >
                    <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                      체크리스트
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: 'var(--color-accent)',
                      }}
                    >
                      {completedItems}/{totalItems}
                    </span>
                  </div>
                  <div
                    style={{
                      flex: 1,
                      height: 4,
                      background: 'var(--color-border)',
                      borderRadius: 2,
                      overflow: 'hidden',
                      marginBottom: 14,
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${clPct}%`,
                        background: 'var(--color-accent)',
                        borderRadius: 2,
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>

                  {/* Comment count */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 6,
                    }}
                  >
                    <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>댓글</span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      {commentList.length}개
                    </span>
                  </div>

                  {/* Created at */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>생성일</span>
                    <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                      {ticket.createdAt.slice(0, 10)}
                    </span>
                  </div>

                  {/* Updated at */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>수정일</span>
                    <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                      {ticket.updatedAt.slice(0, 10)}
                    </span>
                  </div>
                </div>
              </div>
              {/* ── end RIGHT ── */}
            </div>
            {/* ── end TWO-COLUMN GRID ── */}
          </div>
          {/* ── end scrollable area ── */}

          {/* ══════════ FOOTER ══════════ */}
          <div
            style={{
              height: 45,
              padding: '0 20px',
              borderTop: '1px solid var(--color-border)',
              background: 'var(--color-board-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Save button */}
              <button
                onClick={handleSave}
                disabled={!isDirty || !title.trim() || isSaving}
                aria-label="저장"
                style={{
                  ...footerBtnBase,
                  background: isDirty && title.trim() ? 'var(--color-accent)' : 'transparent',
                  color: isDirty && title.trim() ? '#fff' : 'var(--color-text-secondary)',
                  border: isDirty && title.trim() ? 'none' : '1px solid #9CA3AF',
                  opacity: isSaving ? 0.7 : 1,
                  cursor: isDirty && title.trim() && !isSaving ? 'pointer' : 'default',
                }}
                onMouseEnter={(e) => {
                  if (isDirty && title.trim() && !isSaving) {
                    e.currentTarget.style.background = 'var(--color-accent-hover, #527D6F)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (isDirty && title.trim() && !isSaving) {
                    e.currentTarget.style.background = 'var(--color-accent)';
                  }
                }}
              >
                <Save size={13} />
                {isSaving ? '저장 중...' : '저장'}
              </button>

              {/* Close button */}
              <button
                onClick={onClose}
                style={{
                  ...footerBtnBase,
                  background: 'transparent',
                  color: 'var(--color-text-secondary)',
                  border: '1px solid #9CA3AF',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--color-board-bg, #E8EDF2)';
                  e.currentTarget.style.color = 'var(--color-text-primary)';
                  e.currentTarget.style.borderColor = '#6B7280';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--color-text-secondary)';
                  e.currentTarget.style.borderColor = '#9CA3AF';
                }}
              >
                닫기
              </button>
            </div>

            {/* Delete button */}
            <button
              onClick={() => setShowDelete(true)}
              aria-label="삭제"
              style={{
                ...footerBtnBase,
                background: 'transparent',
                color: '#DC2626',
                border: '1px solid #F87171',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#FEF2F2';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <Trash2 size={13} />
              삭제
            </button>
          </div>
          {/* ── end FOOTER ── */}
        </div>
        {/* ── end outer flex column ── */}
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

// ─── sub-components ──────────────────────────────────────────────────────────

function MetaRow({ label, headerContent, children }: { label: string; headerContent?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        padding: '8px 0',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      {headerContent ?? (
        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: 'var(--color-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          {label}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minHeight: 28 }}>
        {children}
      </div>
    </div>
  );
}

