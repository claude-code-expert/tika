'use client';

import { useState, useRef, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ChecklistSection } from './ChecklistSection';
import { CommentSection } from './CommentSection';
import type { TicketWithMeta, ChecklistItem, Label, Issue, Member, Comment } from '@/types/index';
import { TICKET_STATUS, TICKET_PRIORITY, TICKET_TYPE } from '@/types/index';
import type { UpdateTicketInput } from '@/lib/validations';

interface TicketModalProps {
  ticket: TicketWithMeta;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: number, data: UpdateTicketInput) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onDuplicate?: () => Promise<void>;
  currentMemberId?: number | null;
}

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  BACKLOG: { bg: '#F3F4F6', color: '#6B7280' },
  TODO: { bg: '#DBEAFE', color: '#1D4ED8' },
  IN_PROGRESS: { bg: '#FEF3C7', color: '#B45309' },
  DONE: { bg: '#D1FAE5', color: '#065F46' },
};

const PRIORITY_STYLES: Record<string, { bg: string; color: string }> = {
  LOW: { bg: '#F3F4F6', color: '#6B7280' },
  MEDIUM: { bg: '#FEF9C3', color: '#A16207' },
  HIGH: { bg: '#FFEDD5', color: '#C2410C' },
  CRITICAL: { bg: '#FEE2E2', color: '#DC2626' },
};


export function TicketModal({
  ticket,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  onDuplicate,
  currentMemberId = null,
}: TicketModalProps) {
  const [title, setTitle] = useState(ticket.title);
  const [description, setDescription] = useState(ticket.description ?? '');
  const [status, setStatus] = useState(ticket.status);
  const [priority, setPriority] = useState(ticket.priority);
  const [dueDate, setDueDate] = useState(ticket.dueDate ?? '');
  const [type, setType] = useState(ticket.type);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>(ticket.checklistItems);
  const [allLabels, setAllLabels] = useState<Label[]>([]);
  const [selectedLabelIds, setSelectedLabelIds] = useState<number[]>(
    ticket.labels.map((l) => l.id),
  );
  const [labelsLoaded, setLabelsLoaded] = useState(false);
  const [showLabelPicker, setShowLabelPicker] = useState(false);
  const [selectedIssueId, setSelectedIssueId] = useState<number | null>(ticket.issueId ?? null);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<number | null>(
    ticket.assigneeId ?? null,
  );
  const [allIssues, setAllIssues] = useState<Issue[]>([]);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [commentList, setCommentList] = useState<Comment[]>([]);
  const labelAreaRef = useRef<HTMLDivElement>(null);

  // Fetch issues, members, and comments on mount
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

  // Close label picker on outside click
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

  const isDirty =
    title !== ticket.title ||
    description !== (ticket.description ?? '') ||
    status !== ticket.status ||
    priority !== ticket.priority ||
    dueDate !== (ticket.dueDate ?? '') ||
    type !== ticket.type ||
    selectedIssueId !== (ticket.issueId ?? null) ||
    selectedAssigneeId !== (ticket.assigneeId ?? null);

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
      if (selectedIssueId !== (ticket.issueId ?? null)) patch.issueId = selectedIssueId;
      if (selectedAssigneeId !== (ticket.assigneeId ?? null))
        patch.assigneeId = selectedAssigneeId;
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

  // Labels to display: before loading use ticket.labels, after loading use allLabels
  const displayLabels: Label[] = labelsLoaded
    ? allLabels.filter((l) => selectedLabelIds.includes(l.id))
    : ticket.labels.filter((l) => selectedLabelIds.includes(l.id));

  const statusStyle = STATUS_STYLES[status] ?? STATUS_STYLES.TODO;
  const priorityStyle = PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.MEDIUM;

  // Action button base style
  const actionBtnStyle: React.CSSProperties = {
    padding: '7px 14px',
    border: '1px solid var(--color-border)',
    borderRadius: 6,
    background: 'transparent',
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--color-text-secondary)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    fontFamily: 'inherit',
    transition: 'all 0.15s',
  };

  const handleActionHover = (e: React.MouseEvent<HTMLButtonElement>, enter: boolean) => {
    const el = e.currentTarget;
    if (enter) {
      el.style.borderColor = 'var(--color-border-hover)';
      el.style.color = 'var(--color-text-primary)';
      el.style.background = 'var(--color-board-bg)';
    } else {
      el.style.borderColor = 'var(--color-border)';
      el.style.color = 'var(--color-text-secondary)';
      el.style.background = 'transparent';
    }
  };

  const handleDangerHover = (e: React.MouseEvent<HTMLButtonElement>, enter: boolean) => {
    const el = e.currentTarget;
    if (enter) {
      el.style.borderColor = '#DC2626';
      el.style.background = '#FEF2F2';
    } else {
      el.style.borderColor = 'var(--color-border)';
      el.style.background = 'transparent';
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} maxWidth={720}>
        {/* Outer flex column — fills Modal panel */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          {/* ===== detail-top ===== */}
          <div
            style={{
              padding: '20px 24px 16px',
              borderBottom: '1px solid var(--color-border)',
              flexShrink: 0,
            }}
          >
            {/* Top bar: labels + close */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 12,
                marginBottom: 14,
              }}
            >
              {/* Label edit area */}
              <div
                ref={labelAreaRef}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 6,
                  flex: 1,
                  position: 'relative',
                }}
              >
                {displayLabels.map((label) => (
                  <div
                    key={label.id}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '3px 8px 3px 10px',
                      borderRadius: 20,
                      fontSize: 11,
                      fontWeight: 600,
                      background: label.color,
                      color: '#fff',
                    }}
                  >
                    {label.name}
                    <button
                      onClick={() => handleLabelToggle(label.id)}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        fontSize: 12,
                        padding: 0,
                        lineHeight: 1,
                        opacity: 0.7,
                        color: '#fff',
                      }}
                      aria-label={`${label.name} 라벨 제거`}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  onClick={handleLabelAddClick}
                  style={{
                    padding: '3px 10px',
                    border: '1px dashed var(--color-border-hover)',
                    borderRadius: 20,
                    fontSize: 11,
                    color: 'var(--color-text-muted)',
                    cursor: 'pointer',
                    background: 'transparent',
                    fontFamily: 'inherit',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-accent)';
                    e.currentTarget.style.color = 'var(--color-accent)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-border-hover)';
                    e.currentTarget.style.color = 'var(--color-text-muted)';
                  }}
                >
                  + 라벨 추가
                </button>

                {/* Label picker dropdown */}
                {showLabelPicker && labelsLoaded && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 32,
                      left: 0,
                      background: '#fff',
                      border: '1px solid var(--color-border)',
                      borderRadius: 8,
                      boxShadow: 'var(--shadow-dropdown)',
                      padding: 8,
                      zIndex: 200,
                      minWidth: 200,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: 'var(--color-text-muted)',
                        marginBottom: 8,
                        padding: '0 4px',
                      }}
                    >
                      라벨 선택
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {allLabels.map((label) => (
                        <button
                          key={label.id}
                          onClick={() => {
                            handleLabelToggle(label.id);
                            setShowLabelPicker(false);
                          }}
                          style={{
                            padding: '3px 10px',
                            borderRadius: 20,
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: 'pointer',
                            border: selectedLabelIds.includes(label.id)
                              ? '2px solid rgba(0,0,0,0.3)'
                              : '2px solid transparent',
                            background: label.color,
                            color: '#fff',
                            fontFamily: 'inherit',
                            transition: 'transform 0.1s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.05)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                        >
                          {label.name}
                        </button>
                      ))}
                    </div>
                    {allLabels.length === 0 && (
                      <p
                        style={{ fontSize: 11, color: 'var(--color-text-muted)', padding: '4px' }}
                      >
                        라벨이 없습니다
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Close button */}
              <button
                onClick={onClose}
                style={{
                  width: 28,
                  height: 28,
                  border: 'none',
                  background: 'transparent',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 18,
                  color: 'var(--color-text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontFamily: 'inherit',
                  transition: 'background 0.1s, color 0.1s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--color-board-bg)';
                  e.currentTarget.style.color = 'var(--color-text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--color-text-muted)';
                }}
                aria-label="닫기"
              >
                ✕
              </button>
            </div>

            {/* Title */}
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 20,
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                lineHeight: 1.4,
                marginBottom: 10,
                background: 'transparent',
              }}
              aria-label="티켓 제목"
            />

            {/* Issue selector */}
            <div style={{ marginBottom: 14 }}>
              <select
                value={selectedIssueId ?? ''}
                onChange={(e) =>
                  setSelectedIssueId(e.target.value ? Number(e.target.value) : null)
                }
                aria-label="상위 이슈"
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 500,
                  background: 'var(--color-board-bg)',
                  color: selectedIssueId
                    ? 'var(--color-text-primary)'
                    : 'var(--color-text-muted)',
                  border: '1px solid var(--color-border)',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  outline: 'none',
                  maxWidth: 280,
                }}
              >
                <option value="">이슈 없음</option>
                {allIssues.map((issue) => (
                  <option key={issue.id} value={issue.id}>
                    [{issue.type.charAt(0)}] {issue.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Overdue warning */}
            {ticket.isOverdue && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  marginBottom: 10,
                  padding: '4px 10px',
                  background: '#FEF2F2',
                  borderRadius: 6,
                  fontSize: 12,
                  color: '#DC2626',
                }}
              >
                ⚠ 마감 초과
              </div>
            )}

            {/* Meta row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {/* Status */}
              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as (typeof TICKET_STATUS)[keyof typeof TICKET_STATUS])
                }
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  background: statusStyle.bg,
                  color: statusStyle.color,
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  outline: 'none',
                }}
                aria-label="상태"
              >
                {Object.values(TICKET_STATUS).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              {/* Priority */}
              <select
                value={priority}
                onChange={(e) =>
                  setPriority(
                    e.target.value as (typeof TICKET_PRIORITY)[keyof typeof TICKET_PRIORITY],
                  )
                }
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  background: priorityStyle.bg,
                  color: priorityStyle.color,
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  outline: 'none',
                }}
                aria-label="우선순위"
              >
                {Object.values(TICKET_PRIORITY).map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>

              {/* Type */}
              <select
                value={type}
                onChange={(e) =>
                  setType(e.target.value as (typeof TICKET_TYPE)[keyof typeof TICKET_TYPE])
                }
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  background: 'var(--color-board-bg)',
                  color: 'var(--color-text-secondary)',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  outline: 'none',
                }}
                aria-label="유형"
              >
                {Object.values(TICKET_TYPE).map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>

              {/* Due date */}
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  background: dueDate ? '#FEF9C3' : 'var(--color-board-bg)',
                  color: dueDate ? '#A16207' : 'var(--color-text-muted)',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  outline: 'none',
                }}
                aria-label="마감일"
              />

              {/* Assignee selector */}
              <select
                value={selectedAssigneeId ?? ''}
                onChange={(e) =>
                  setSelectedAssigneeId(e.target.value ? Number(e.target.value) : null)
                }
                aria-label="담당자"
                style={{
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 500,
                  background: 'var(--color-board-bg)',
                  color: selectedAssigneeId
                    ? 'var(--color-text-primary)'
                    : 'var(--color-text-muted)',
                  border: '1px solid var(--color-border)',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  outline: 'none',
                }}
              >
                <option value="">담당자 없음</option>
                {allMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.displayName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ===== detail-body ===== */}
          <div
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              padding: '0 24px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* 설명 section */}
            <div
              style={{
                padding: '16px 0',
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--color-text-secondary)',
                  marginBottom: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                📝 설명
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={1000}
                rows={4}
                placeholder="설명을 입력하세요..."
                style={{
                  width: '100%',
                  resize: 'vertical',
                  minHeight: 80,
                  padding: '8px 12px',
                  border: '1px solid var(--color-border)',
                  borderRadius: 6,
                  fontSize: 14,
                  lineHeight: 1.7,
                  color: 'var(--color-text-primary)',
                  background: '#fff',
                  fontFamily: 'inherit',
                  outline: 'none',
                  transition: 'border-color 0.15s',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--color-accent)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--color-border)';
                }}
                aria-label="설명"
              />
            </div>

            {/* 체크리스트 section */}
            <div style={{ padding: '16px 0', borderBottom: '1px solid var(--color-border)' }}>
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

            {/* 댓글 section */}
            <CommentSection
              ticketId={ticket.id}
              comments={commentList}
              currentMemberId={currentMemberId}
              onCommentsChange={setCommentList}
            />
          </div>

          {/* ===== detail-footer ===== */}
          <div
            style={{
              padding: '12px 24px',
              borderTop: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleSave}
                disabled={!isDirty || !title.trim() || isSaving}
                aria-label="저장"
                style={{
                  ...actionBtnStyle,
                  background: isDirty && title.trim() ? 'var(--color-accent)' : 'transparent',
                  color: isDirty && title.trim() ? '#fff' : 'var(--color-text-secondary)',
                  border: isDirty && title.trim() ? 'none' : '1px solid var(--color-border)',
                  opacity: isSaving ? 0.7 : 1,
                  cursor: isDirty && title.trim() && !isSaving ? 'pointer' : 'default',
                }}
                onMouseEnter={(e) => {
                  if (isDirty && title.trim() && !isSaving) {
                    e.currentTarget.style.background = 'var(--color-accent-hover)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (isDirty && title.trim() && !isSaving) {
                    e.currentTarget.style.background = 'var(--color-accent)';
                  }
                }}
              >
                {isSaving ? '저장 중...' : '✏ 저장'}
              </button>
              <button
                style={actionBtnStyle}
                onMouseEnter={(e) => handleActionHover(e, true)}
                onMouseLeave={(e) => handleActionHover(e, false)}
                onClick={onDuplicate ? async () => { setIsSaving(true); try { await onDuplicate(); onClose(); } finally { setIsSaving(false); } } : undefined}
                title={onDuplicate ? '티켓 복제' : '복제 기능은 준비 중입니다'}
              >
                📋 복제
              </button>
              <button
                onClick={onClose}
                aria-label="취소"
                style={actionBtnStyle}
                onMouseEnter={(e) => handleActionHover(e, true)}
                onMouseLeave={(e) => handleActionHover(e, false)}
              >
                ✕ 닫기
              </button>
            </div>
            <button
              onClick={() => setShowDelete(true)}
              aria-label="삭제"
              style={{ ...actionBtnStyle, color: '#DC2626' }}
              onMouseEnter={(e) => handleDangerHover(e, true)}
              onMouseLeave={(e) => handleDangerHover(e, false)}
            >
              🗑 삭제
            </button>
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
