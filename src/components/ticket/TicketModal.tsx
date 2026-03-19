'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { BreadcrumbPicker } from './BreadcrumbPicker';
import { ChecklistSection } from './ChecklistSection';
import { CommentSection } from './CommentSection';
import type { TicketWithMeta, Ticket, ChecklistItem, Label, Member, Comment } from '@/types/index';
import { TICKET_STATUS, TICKET_PRIORITY, TICKET_TYPE } from '@/types/index';
import type { UpdateTicketInput } from '@/lib/validations';
import { PRIORITY_CONFIG, STATUS_CONFIG } from '@/components/ui/Chips';
import { CHEVRON_SVG, metaSelectStyle, metaDateStyle as metaDateStyleShared } from '@/lib/ticketMetaStyles';
import { LabelBadge, labelTextColor } from '@/components/label/LabelBadge';
import {
  FileText,
  Users,
  UserPlus,
  Save,
  Link2,
  X,
  Trash2,
  Copy,
} from 'lucide-react';
import { Toast } from '@/components/ui/Toast';

// ─── constants ─────────────────────────────────────────────────────────────────

// ─── UrlCopyBadge ────────────────────────────────────────────────────────────

function UrlCopyBadge({ ticket, workspaceName }: { ticket: TicketWithMeta; workspaceName?: string }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [hover, setHover] = useState(false);
  const path = `/workspace/${ticket.workspaceId}/${ticket.id}`;
  const fullUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${path}`
    : path;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span
        onClick={() => router.push(path)}
        style={{
          fontSize: 10,
          color: '#8993A4',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: 260,
          direction: 'rtl',
          textAlign: 'left',
          cursor: 'pointer',
          transition: 'color 0.12s',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--color-accent)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#8993A4'; }}
      >
        {fullUrl}
      </span>
      <button
        onClick={handleCopy}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 22,
          height: 22,
          borderRadius: 4,
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          background: 'transparent',
          color: copied ? '#629584' : '#8993A4',
          transition: 'color 0.12s',
        }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        aria-label="URL 복사"
      >
        <Copy size={12} />
        {(hover || copied) && (
          <span
            style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#1F2937',
              color: '#fff',
              fontSize: 10,
              fontWeight: 500,
              padding: '3px 8px',
              borderRadius: 4,
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              zIndex: 50,
            }}
          >
            {copied ? '복사됨' : 'URL 복사'}
          </span>
        )}
      </button>
    </div>
  );
}

// ─── IconBtnWithTooltip ──────────────────────────────────────────────────────

function IconBtnWithTooltip({
  label,
  icon,
  onClick,
  hoverBg = 'var(--color-board-bg)',
  hoverColor = 'var(--color-text-primary)',
  style,
}: {
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  hoverBg?: string;
  hoverColor?: string;
  style?: React.CSSProperties;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      aria-label={label}
      style={{
        position: 'relative',
        width: 28,
        height: 28,
        border: 'none',
        borderRadius: 6,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
        fontFamily: 'inherit',
        fontSize: 12,
        color: 'var(--color-text-muted)',
        background: 'transparent',
        outline: 'none',
        transition: 'background 0.1s, color 0.1s',
        ...style,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = hoverBg;
        (e.currentTarget as HTMLElement).style.color = hoverColor;
        setHover(true);
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = 'transparent';
        (e.currentTarget as HTMLElement).style.color = 'var(--color-text-muted)';
        setHover(false);
      }}
    >
      {icon}
      {hover && (
        <span
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#1F2937',
            color: '#fff',
            fontSize: 10,
            fontWeight: 500,
            padding: '3px 8px',
            borderRadius: 4,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 50,
          }}
        >
          {label}
        </span>
      )}
    </button>
  );
}

// ─── types ────────────────────────────────────────────────────────────────────

interface TicketModalProps {
  ticket: TicketWithMeta;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: number, data: UpdateTicketInput) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onDuplicate?: () => Promise<void>;
  onChecklistChange?: (items: ChecklistItem[]) => void;
  currentMemberId?: number | null;
  workspaceName?: string;
  readOnly?: boolean;
}

// ─── component ────────────────────────────────────────────────────────────────

export function TicketModal({
  ticket,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  onDuplicate,
  onChecklistChange,
  workspaceName,
  currentMemberId = null,
  readOnly = false,
}: TicketModalProps) {
  // ── editable state ──
  const [title, setTitle] = useState(ticket.title);
  const [description, setDescription] = useState(ticket.description ?? '');
  const [status, setStatus] = useState(ticket.status);
  const [priority, setPriority] = useState(ticket.priority);
  const [type, setType] = useState(ticket.type);
  const [startDate, setStartDate] = useState(ticket.plannedStartDate ?? '');
  const [dueDate, setDueDate] = useState(ticket.plannedEndDate ?? '');
  const [selectedParentId, setSelectedParentId] = useState<number | null>(ticket.parentId ?? null);
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

  // ── parent / member state ──
  const [allParents, setAllParents] = useState<Ticket[]>([]);
  const [allMembers, setAllMembers] = useState<Member[]>([]);

  // ── UI state ──
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showDuplicateConfirm, setShowDuplicateConfirm] = useState(false);
  const [showAssigneePicker, setShowAssigneePicker] = useState(false);
  const [assigneeSearch, setAssigneeSearch] = useState('');


  // ── refs ──
  const titleTextareaRef = useRef<HTMLTextAreaElement>(null);
  const descTextareaRef = useRef<HTMLTextAreaElement>(null);
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

  // ── fetch parents, members, comments ──
  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    Promise.all([
      fetch(`/api/tickets?types=GOAL,STORY,FEATURE&workspaceId=${ticket.workspaceId}`, { signal }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch(`/api/members?workspaceId=${ticket.workspaceId}`, { signal }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch(`/api/tickets/${ticket.id}/comments`, { signal }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ]).then(([parentsData, membersData, commentsData]) => {
      if (parentsData?.tickets) {
        setAllParents(parentsData.tickets);
      }
      if (membersData?.members) setAllMembers(membersData.members);
      if (commentsData?.comments) setCommentList(commentsData.comments);
    });
    return () => controller.abort();
  }, [ticket.id]);

  // ── auto-resize description textarea on mount ──
  useEffect(() => {
    const el = descTextareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [description]);

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
    startDate !== (ticket.plannedStartDate ?? '') ||
    dueDate !== (ticket.plannedEndDate ?? '') ||
    selectedParentId !== (ticket.parentId ?? null) ||
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
      if (startDate !== (ticket.plannedStartDate ?? '')) patch.plannedStartDate = startDate || null;
      if (dueDate !== (ticket.plannedEndDate ?? '')) patch.plannedEndDate = dueDate || null;
      if (selectedParentId !== (ticket.parentId ?? null)) patch.parentId = selectedParentId;
      const origIds = [...ticket.assignees.map((a) => a.id)].sort().join(',');
      const newIds = [...selectedAssigneeIds].sort().join(',');
      if (origIds !== newIds) patch.assigneeIds = selectedAssigneeIds;
      await onUpdate(ticket.id, patch);
      setShowSaveToast(true);
      setTimeout(() => {
        setShowSaveToast(false);
        onClose();
      }, 1500);
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

  // ── duplicate ──
  const handleDuplicate = async () => {
    if (!onDuplicate) return;
    setShowDuplicateConfirm(false);
    setIsSaving(true);
    try {
      await onDuplicate();
      onClose();
    } finally {
      setIsSaving(false);
    }
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

  const statusStyle = STATUS_CONFIG[status] ?? STATUS_CONFIG.TODO;
  const priorityStyle = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.MEDIUM;
  const completedItems = checklistItems.filter((i) => i.isCompleted).length;
  const totalItems = checklistItems.length;
  const clPct = totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100);

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

  // TicketModal uses height:32 + boxSizing for date inputs (vs shared height:28)
  const metaDateStyle: React.CSSProperties = { ...metaDateStyleShared, height: 32, boxSizing: 'border-box' };

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        maxWidth={800}
        maxHeight="90vh"
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
            {/* Left: Breadcrumb picker */}
            <BreadcrumbPicker
              ticketType={type}
              parentId={ticket.parentId ?? null}
              parent={ticket.parent}
              allParents={allParents}
              onChange={(id) => setSelectedParentId(id)}
            />

            {/* Right: ticket number + URL copy + close */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--color-text-muted)',
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  whiteSpace: 'nowrap',
                }}
              >
                {workspaceName ? `${workspaceName}-${ticket.id}` : `#${ticket.id}`}
              </span>
              <IconBtnWithTooltip
                label="URL 복사"
                icon={<Link2 size={15} />}
                onClick={() => {
                  const url = `${window.location.origin}/workspace/${ticket.workspaceId}/${ticket.id}`;
                  navigator.clipboard.writeText(url);
                }}
              />
              <IconBtnWithTooltip
                label="닫기"
                icon={<X size={16} />}
                onClick={onClose}
              />
            </div>
          </div>
        }
      >
        {/* ══════════ outer flex column ══════════ */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>

          {/* ══════════ scrollable area (title + two-column grid) ══════════ */}
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

            {/* ── TITLE SECTION ── */}
            <div
              style={{
                height: 40,
                padding: '0 24px',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                flexShrink: 0,
              }}
            >
              {/* Auto-resize title textarea */}
              <textarea
                ref={titleTextareaRef}
                value={title}
                onChange={(e) => {
                  if (!readOnly) setTitle(e.target.value);
                }}
                onInput={autoResizeTitle}
                maxLength={200}
                rows={1}
                aria-label="제목"
                readOnly={readOnly}
                style={{
                  flex: 1,
                  minWidth: 0,
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontFamily: "'Plus Jakarta Sans', 'Noto Sans KR', sans-serif",
                  fontSize: 16,
                  fontWeight: 700,
                  color: 'var(--color-text-primary)',
                  lineHeight: 1.3,
                  resize: 'none',
                  overflow: 'hidden',
                  cursor: readOnly ? 'default' : 'text',
                  padding: '4px 6px',
                  borderRadius: 4,
                }}
                onFocus={(e) => {
                  if (!readOnly) e.target.style.background = 'var(--color-board-bg)';
                }}
                onBlur={(e) => {
                  e.target.style.background = 'transparent';
                }}
              />

              {/* Type select */}
              <select
                value={type}
                onChange={(e) =>
                  setType(e.target.value as (typeof TICKET_TYPE)[keyof typeof TICKET_TYPE])
                }
                aria-label="유형"
                disabled={readOnly}
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
                  flexShrink: 0,
                }}
              >
                {Object.values(TICKET_TYPE).map((t) => (
                  <option key={t} value={t}>
                    {t === 'GOAL' ? 'Goal' :
                     t === 'STORY' ? 'Story' :
                     t === 'FEATURE' ? 'Feature' : 'Task'}
                  </option>
                ))}
              </select>


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
                  padding: '16px 24px',
                  borderRight: '1px solid var(--color-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
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
                    ref={descTextareaRef}
                    value={description}
                    onChange={(e) => {
                      if (readOnly) return;
                      setDescription(e.target.value);
                      e.target.style.height = 'auto';
                      e.target.style.height = `${e.target.scrollHeight}px`;
                    }}
                    maxLength={1000}
                    placeholder="티켓에 대한 설명을 입력하세요..."
                    aria-label="설명"
                    readOnly={readOnly}
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
                      resize: 'none',
                      overflow: 'hidden',
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
                  {!readOnly && (<button
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
                  </button>)}
                  <div
                    ref={labelAreaRef}
                    style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 4, position: 'relative', minHeight: 20 }}
                  >
                    {displayLabels.map((label) => (
                      <LabelBadge
                        key={label.id}
                        label={label}
                        size="sm"
                        onRemove={readOnly ? undefined : () => handleLabelToggle(label.id)}
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
                                  borderRadius: 4,
                                  fontSize: 11,
                                  fontWeight: 500,
                                  cursor: isUsed ? 'default' : 'pointer',
                                  border: `1px solid ${label.color}`,
                                  background: isUsed ? `${label.color}18` : 'transparent',
                                  color: '#2C3E50',
                                  fontFamily: 'inherit',
                                  opacity: isUsed ? 0.5 : 1,
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
                        const updated = [...checklistItems, item];
                        setChecklistItems(updated);
                        onChecklistChange?.(updated);
                      }
                    }}
                    onToggle={async (itemId, isCompleted) => {
                      const updated = checklistItems.map((i) =>
                        i.id === itemId ? { ...i, isCompleted } : i,
                      );
                      setChecklistItems(updated);
                      onChecklistChange?.(updated);
                      const res = await fetch(`/api/tickets/${ticket.id}/checklist/${itemId}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ isCompleted }),
                      });
                      if (!res.ok) {
                        const rolled = checklistItems.map((i) =>
                          i.id === itemId ? { ...i, isCompleted: !isCompleted } : i,
                        );
                        setChecklistItems(rolled);
                        onChecklistChange?.(rolled);
                      }
                    }}
                    onDelete={async (itemId) => {
                      const snapshot = checklistItems;
                      const updated = checklistItems.filter((i) => i.id !== itemId);
                      setChecklistItems(updated);
                      onChecklistChange?.(updated);
                      const res = await fetch(`/api/tickets/${ticket.id}/checklist/${itemId}`, {
                        method: 'DELETE',
                      });
                      if (!res.ok) {
                        setChecklistItems(snapshot);
                        onChecklistChange?.(snapshot);
                      }
                    }}
                    readOnly={readOnly}
                  />
                </div>

                {/* 댓글 section */}
                <CommentSection
                  ticketId={ticket.id}
                  comments={commentList}
                  currentMemberId={currentMemberId}
                  onCommentsChange={setCommentList}
                  readOnly={readOnly}
                />

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
                    disabled={readOnly}
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
                    disabled={readOnly}
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

                {/* Start date */}
                <MetaRow label="시작 예정일">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                    }}
                    aria-label="시작 예정일"
                    disabled={readOnly}
                    max={`${new Date().getFullYear() + 5}-12-31`}
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
                      onChange={(e) => {
                        setDueDate(e.target.value);
                      }}
                      aria-label="종료 예정일"
                      disabled={readOnly}
                      max={`${new Date().getFullYear() + 5}-12-31`}
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

                </div>

                {/* 담당자 section */}
                <div ref={assigneeAreaRef} style={{ borderTop: '1px solid var(--color-border)', paddingTop: 12, position: 'relative' }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                    담당자
                  </div>
                  {currentAssignees.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
                      {currentAssignees.map((member) => (
                        <span
                          key={member.id}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4,
                            height: 28, padding: '0 8px', borderRadius: 5, width: '100%',
                            background: 'transparent', border: `1.5px solid ${member.color}`,
                            color: member.color, fontSize: 11, fontWeight: 600,
                          }}
                        >
                          {member.displayName}
                          {!readOnly && (
                            <button
                              onClick={() => removeAssignee(member.id)}
                              aria-label={`${member.displayName} 담당자 제거`}
                              style={{ width: 12, height: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', color: 'inherit', cursor: 'pointer', fontSize: 10, lineHeight: 1, padding: 0, opacity: 0.6, transition: 'opacity 0.12s' }}
                              onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.6'; }}
                            >×</button>
                          )}
                        </span>
                      ))}
                    </div>
                  )}
                  {!readOnly && (
                    !showAssigneePicker ? (
                      <button
                        onClick={() => { setShowAssigneePicker(true); setAssigneeSearch(''); }}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 6, border: '1px dashed #9CA3AF', cursor: 'pointer', transition: 'all 0.15s', fontSize: 12, color: 'var(--color-text-muted)', background: 'transparent', fontFamily: 'inherit', width: '100%' }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.color = 'var(--color-accent)'; e.currentTarget.style.background = 'var(--color-accent-light, #E8F5F0)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#9CA3AF'; e.currentTarget.style.color = 'var(--color-text-muted)'; e.currentTarget.style.background = 'transparent'; }}
                      >
                        <UserPlus size={12} />
                        담당자 추가
                      </button>
                    ) : (
                      <div style={{ position: 'relative' }}>
                        <input
                          type="text" value={assigneeSearch}
                          onChange={(e) => { setAssigneeSearch(e.target.value); }}
                          placeholder="이름으로 검색..."
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') { setShowAssigneePicker(false); setAssigneeSearch(''); }
                          }}
                          style={{ width: '100%', padding: '5px 10px', border: '1px solid var(--color-accent)', borderRadius: 6, fontSize: 12, fontFamily: 'inherit', color: 'var(--color-text-primary)', background: '#fff', outline: 'none', boxShadow: '0 0 0 3px var(--color-accent-light, #E8F5F0)' }}
                        />
                        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: '#fff', border: '1px solid var(--color-border)', borderRadius: 8, boxShadow: 'var(--shadow-dropdown)', zIndex: 200, padding: 4, maxHeight: 180, overflowY: 'auto' }}>
                          {selectedAssigneeIds.length >= 3 ? (
                            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', padding: '6px 8px' }}>모든 멤버가 배정됨</p>
                          ) : unassignedMembers.filter(m => m.displayName.toLowerCase().includes(assigneeSearch.toLowerCase())).length === 0 ? (
                            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', padding: '6px 8px' }}>검색 결과 없음</p>
                          ) : (
                            unassignedMembers.filter(m => m.displayName.toLowerCase().includes(assigneeSearch.toLowerCase())).map((member) => (
                              <button
                                key={member.id}
                                onMouseDown={(e) => { e.preventDefault(); addAssignee(member.id); setShowAssigneePicker(false); setAssigneeSearch(''); }}
                                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6, border: 'none', background: 'transparent', width: '100%', cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.12s', textAlign: 'left' }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-board-bg)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                              >
                                <span style={{ width: 20, height: 20, borderRadius: '50%', background: member.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 9, fontWeight: 700, flexShrink: 0 }}>
                                  {member.displayName.charAt(0)}
                                </span>
                                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-primary)' }}>{member.displayName}</span>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )
                  )}
                </div>

                {/* Created / Updated at */}
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 12, marginTop: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>수정일</span>
                    <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{ticket.updatedAt.slice(0, 10)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>생성일</span>
                    <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{ticket.createdAt.slice(0, 10)}</span>
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
              {!readOnly && <button
                onClick={handleSave}
                disabled={!isDirty || !title.trim() || isSaving}
                aria-label="저장"
                style={{
                  ...footerBtnBase,
                  background: isDirty && title.trim() ? '#EFF6FF' : 'transparent',
                  color: isDirty && title.trim() ? '#2563EB' : 'var(--color-text-secondary)',
                  border: isDirty && title.trim() ? '1.5px solid #3B82F6' : '1px solid #9CA3AF',
                  opacity: isSaving ? 0.7 : 1,
                  cursor: isDirty && title.trim() && !isSaving ? 'pointer' : 'default',
                  fontWeight: isDirty && title.trim() ? 700 : 500,
                }}
                onMouseEnter={(e) => {
                  if (isDirty && title.trim() && !isSaving) {
                    e.currentTarget.style.background = '#DBEAFE';
                    e.currentTarget.style.borderColor = '#2563EB';
                  }
                }}
                onMouseLeave={(e) => {
                  if (isDirty && title.trim() && !isSaving) {
                    e.currentTarget.style.background = '#EFF6FF';
                    e.currentTarget.style.borderColor = '#3B82F6';
                  }
                }}
              >
                <Save size={13} />
                {isSaving ? '저장 중...' : '저장'}
              </button>}

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
                <X size={13} />
                닫기
              </button>
            </div>

            {/* Delete button */}
            {!readOnly && <button
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
            </button>}
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

      <ConfirmDialog
        isOpen={showDuplicateConfirm}
        message={`"${ticket.title}" 티켓을 복사해서 새 티켓을 만들겠습니까?`}
        confirmLabel="복제"
        confirmVariant="primary"
        onConfirm={handleDuplicate}
        onCancel={() => setShowDuplicateConfirm(false)}
      />
      {showSaveToast && <Toast message="저장되었습니다" />}
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

