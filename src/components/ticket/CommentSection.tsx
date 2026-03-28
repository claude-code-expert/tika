'use client';

import { useState } from 'react';
import type { Comment } from '@/types/index';
import { MessageCircle } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

interface CommentSectionProps {
  ticketId: number;
  comments: Comment[];
  currentMemberId: number | null;
  onCommentsChange: (comments: Comment[]) => void;
  readOnly?: boolean;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

export function CommentSection({
  ticketId,
  comments,
  currentMemberId,
  onCommentsChange,
  readOnly = false,
}: CommentSectionProps) {
  const [newText, setNewText] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleAdd = async () => {
    const text = newText.trim();
    if (!text || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (res.ok) {
        const data = await res.json() as { comment: Comment };
        onCommentsChange([data.comment, ...comments]);
        setNewText('');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (commentId: number) => {
    const text = editText.trim();
    if (!text) return;
    const res = await fetch(`/api/tickets/${ticketId}/comments/${commentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (res.ok) {
      const data = await res.json() as { comment: Comment };
      onCommentsChange(comments.map((c) => (c.id === commentId ? data.comment : c)));
      setEditingId(null);
      setEditText('');
    }
  };

  const handleDelete = async (commentId: number) => {
    const res = await fetch(`/api/tickets/${ticketId}/comments/${commentId}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      onCommentsChange(comments.filter((c) => c.id !== commentId));
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    border: '1.5px solid #CBD5E1',
    borderRadius: 6,
    fontSize: 13,
    fontFamily: 'inherit',
    color: 'var(--color-text-primary)',
    background: '#fff',
    outline: 'none',
    resize: 'none',
    lineHeight: 1.6,
    transition: 'border-color 0.15s',
  };

  return (
    <div style={{ padding: '16px 0 0' }}>
      {/* Section header */}
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: 'var(--color-text-secondary)',
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <MessageCircle size={13} /> 댓글 {comments.length > 0 && <span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>({comments.length})</span>}
      </div>

      {/* New comment input */}
      {!readOnly && (
        <div style={{ marginBottom: 16 }}>
          <textarea
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="댓글을 입력하세요..."
            rows={2}
            maxLength={500}
            style={inputStyle}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-accent)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#CBD5E1'; }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                handleAdd();
              }
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
              {newText.length}/500
            </span>
            <button
              onClick={handleAdd}
              disabled={!newText.trim() || isSubmitting}
              style={{
                padding: '5px 14px',
                background: newText.trim() ? 'var(--color-accent)' : 'var(--color-board-bg)',
                color: newText.trim() ? '#fff' : 'var(--color-text-muted)',
                border: 'none',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                cursor: newText.trim() && !isSubmitting ? 'pointer' : 'default',
                fontFamily: 'inherit',
                transition: 'background 0.15s',
              }}
            >
              {isSubmitting ? '등록 중...' : '등록'}
            </button>
          </div>
        </div>
      )}

      {/* Comment list */}
      {comments.length === 0 ? (
        <div style={{ fontSize: 12, color: 'var(--color-text-muted)', textAlign: 'center', padding: '8px 0' }}>
          {readOnly ? '댓글이 없습니다' : '첫 댓글을 남겨보세요'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {comments.map((comment) => (
            <div
              key={comment.id}
              style={{
                padding: '10px 12px',
                background: 'var(--color-board-bg)',
                borderRadius: 8,
                border: '1px solid var(--color-border)',
              }}
            >
              {/* Comment header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 6,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {/* Member avatar */}
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: comment.memberColor ?? '#629584',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 10,
                      fontWeight: 700,
                      color: '#fff',
                      flexShrink: 0,
                    }}
                  >
                    {(comment.memberName ?? '?').slice(0, 2).toUpperCase()}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {comment.memberName ?? '알 수 없음'}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                    {timeAgo(comment.createdAt)}
                    {comment.updatedAt !== comment.createdAt && ' (수정됨)'}
                  </span>
                </div>

                {/* Actions (only for own comments, not in readOnly mode) */}
                {!readOnly && currentMemberId && comment.memberId === currentMemberId && (
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      onClick={() => {
                        setEditingId(comment.id);
                        setEditText(comment.text);
                      }}
                      style={{
                        fontSize: 11,
                        color: 'var(--color-text-muted)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '2px 6px',
                        borderRadius: 4,
                        fontFamily: 'inherit',
                      }}
                    >
                      수정
                    </button>
                    <button
                      onClick={() => setDeletingId(comment.id)}
                      style={{
                        fontSize: 11,
                        color: '#DC2626',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '2px 6px',
                        borderRadius: 4,
                        fontFamily: 'inherit',
                      }}
                    >
                      삭제
                    </button>
                  </div>
                )}
              </div>

              {/* Comment body */}
              {editingId === comment.id ? (
                <div>
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={2}
                    maxLength={500}
                    autoFocus
                    style={{ ...inputStyle, marginBottom: 6 }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-accent)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; }}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') { setEditingId(null); setEditText(''); }
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { handleEdit(comment.id); }
                    }}
                  />
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => { setEditingId(null); setEditText(''); }}
                      style={{
                        fontSize: 12, padding: '4px 10px', border: '1px solid var(--color-border)',
                        borderRadius: 5, background: 'transparent', cursor: 'pointer', fontFamily: 'inherit',
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      취소
                    </button>
                    <button
                      onClick={() => handleEdit(comment.id)}
                      disabled={!editText.trim()}
                      style={{
                        fontSize: 12, padding: '4px 10px', border: 'none',
                        borderRadius: 5, background: 'var(--color-accent)', color: '#fff',
                        cursor: editText.trim() ? 'pointer' : 'default', fontFamily: 'inherit', fontWeight: 600,
                      }}
                    >
                      저장
                    </button>
                  </div>
                </div>
              ) : (
                <p
                  style={{
                    fontSize: 13,
                    color: 'var(--color-text-primary)',
                    lineHeight: 1.6,
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {comment.text}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
      <ConfirmDialog
        isOpen={deletingId !== null}
        message="댓글을 삭제하시겠습니까?"
        confirmLabel="삭제"
        confirmVariant="danger"
        onConfirm={async () => {
          if (deletingId === null) return;
          const id = deletingId;
          setDeletingId(null);
          await handleDelete(id);
        }}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
}
