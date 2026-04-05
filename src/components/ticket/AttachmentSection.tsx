'use client';

import { useRef, useState } from 'react';
import type { Attachment } from '@/types/index';
import { Paperclip, X, Download } from 'lucide-react';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface AttachmentSectionProps {
  ticketId: number;
  attachments: Attachment[];
  onAttachmentsChange: (list: Attachment[]) => void;
  readOnly?: boolean;
}

export function AttachmentSection({
  ticketId,
  attachments,
  onAttachmentsChange,
  readOnly = false,
}: AttachmentSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!e.target.files) return;
    e.target.value = '';
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setError('파일 크기는 10MB 이하여야 합니다');
      return;
    }

    setError(null);
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`/api/tickets/${ticketId}/attachments`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message ?? '업로드에 실패했습니다');
      }
      const { attachment } = await res.json();
      onAttachmentsChange([...attachments, attachment]);
    } catch (err) {
      setError(err instanceof Error ? err.message : '업로드에 실패했습니다');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (attachmentId: number) => {
    const snapshot = attachments;
    onAttachmentsChange(attachments.filter((a) => a.id !== attachmentId));
    try {
      const res = await fetch(`/api/tickets/${ticketId}/attachments/${attachmentId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        onAttachmentsChange(snapshot);
        const err = await res.json();
        setError(err.error?.message ?? '삭제에 실패했습니다');
      }
    } catch {
      onAttachmentsChange(snapshot);
      setError('삭제에 실패했습니다');
    }
  };

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
          paddingTop: 16,
          borderTop: '1px solid var(--color-border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Paperclip size={14} color="var(--color-text-muted)" />
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            첨부파일
          </span>
          {attachments.length > 0 && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: 'var(--color-accent)',
                background: 'var(--color-accent-light)',
                borderRadius: 10,
                padding: '1px 6px',
              }}
            >
              {attachments.length}
            </span>
          )}
        </div>
        {!readOnly && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            aria-label="파일 첨부"
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: isUploading ? 'var(--color-text-muted)' : 'var(--color-accent)',
              background: 'none',
              border: 'none',
              cursor: isUploading ? 'not-allowed' : 'pointer',
              padding: 0,
            }}
          >
            {isUploading ? '업로드 중…' : '+ 파일 추가'}
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: 'none' }}
          onChange={handleFileChange}
          aria-hidden="true"
        />
      </div>

      {/* Error */}
      {error && (
        <p style={{ fontSize: 11, color: '#EF4444', marginBottom: 8 }}>{error}</p>
      )}

      {/* List */}
      {attachments.length === 0 ? (
        !readOnly && (
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 8 }}>
            첨부파일이 없습니다.
          </p>
        )
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {attachments.map((a) => (
            <li
              key={a.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 8px',
                borderRadius: 6,
                background: 'var(--color-board-bg)',
                fontSize: 12,
              }}
            >
              <Paperclip size={12} color="var(--color-text-muted)" style={{ flexShrink: 0 }} />
              <span
                style={{
                  flex: 1,
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  color: 'var(--color-text-primary)',
                }}
                title={a.name}
              >
                {a.name}
              </span>
              <span style={{ fontSize: 10, color: 'var(--color-text-muted)', flexShrink: 0 }}>
                {formatBytes(a.size)}
              </span>
              <a
                href={a.url}
                download={a.name}
                aria-label={`${a.name} 다운로드`}
                style={{ display: 'flex', color: 'var(--color-text-muted)', flexShrink: 0 }}
              >
                <Download size={12} />
              </a>
              {!readOnly && (
                <button
                  onClick={() => handleDelete(a.id)}
                  aria-label={`${a.name} 삭제`}
                  style={{
                    display: 'flex',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    color: 'var(--color-text-muted)',
                    flexShrink: 0,
                  }}
                >
                  <X size={12} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
