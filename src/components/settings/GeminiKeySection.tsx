'use client';

import { useState, useEffect } from 'react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { SectionProps } from './types';

type UIState =
  | 'IDLE_NO_KEY'
  | 'IDLE_HAS_KEY'
  | 'REPLACE_MODE'
  | 'SAVING'
  | 'DELETING'
  | 'DELETE_CONFIRM_OPEN';

interface KeyMeta {
  maskedKey: string;
  updatedAt: string;
}

export function GeminiKeySection({ showToast, workspaceId }: SectionProps) {
  const [uiState, setUiState] = useState<UIState>('IDLE_NO_KEY');
  const [keyMeta, setKeyMeta] = useState<KeyMeta | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFocused, setIsFocused] = useState(false);

  // Fetch key metadata on mount
  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/settings/gemini-key`)
      .then((res) => res.json())
      .then((json: { data: { maskedKey: string; updatedAt: string } | null }) => {
        if (json.data) {
          setKeyMeta(json.data);
          setUiState('IDLE_HAS_KEY');
        } else {
          setUiState('IDLE_NO_KEY');
        }
      })
      .catch(() => {
        showToast('API 키 정보를 불러오는데 실패했습니다.', 'fail');
        setUiState('IDLE_NO_KEY');
      })
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  async function handleSave() {
    const previousState = uiState;
    setUiState('SAVING');
    setError(null);

    try {
      const res = await fetch('/api/settings/gemini-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: inputValue }),
      });

      const json = await res.json();

      if (res.ok && json.data?.saved === true) {
        const savedKey = inputValue;
        setKeyMeta({ maskedKey: json.data.maskedKey, updatedAt: new Date().toISOString() });
        setUiState('IDLE_HAS_KEY');
        setInputValue('');
        showToast(
          'API 키가 저장되었습니다. 지금 복사하세요 \u2014 창을 닫으면 전체 키를 다시 볼 수 없습니다.',
          'success',
          { label: '복사', onClick: () => navigator.clipboard.writeText(savedKey) },
          8000,
        );
      } else {
        const code = json.error?.code;
        if (code === 'PROBE_FAILED') {
          setError('유효하지 않은 API 키입니다. Gemini API에 접근할 수 없었습니다.');
        } else if (code === 'PROBE_NETWORK_ERROR') {
          setError('키 유효성 확인에 실패했습니다. 네트워크 연결을 확인해주세요.');
        } else {
          setError('API 키 저장에 실패했습니다. 다시 시도해주세요.');
        }
        setUiState(previousState === 'SAVING' ? 'IDLE_NO_KEY' : previousState);
      }
    } catch {
      setError('API 키 저장에 실패했습니다. 네트워크 연결을 확인해주세요.');
      setUiState(previousState === 'SAVING' ? 'IDLE_NO_KEY' : previousState);
    }
  }

  async function handleDelete() {
    setUiState('DELETING');

    try {
      const res = await fetch('/api/settings/gemini-key', { method: 'DELETE' });

      if (res.ok || res.status === 204) {
        setKeyMeta(null);
        setUiState('IDLE_NO_KEY');
        setInputValue('');
        showToast('API 키가 삭제되었습니다.', 'success');
      } else {
        showToast('삭제에 실패했습니다.', 'fail');
        setUiState('IDLE_HAS_KEY');
      }
    } catch {
      showToast('삭제에 실패했습니다.', 'fail');
      setUiState('IDLE_HAS_KEY');
    }
  }

  const formattedDate = keyMeta?.updatedAt
    ? new Date(keyMeta.updatedAt).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  const showKeyCard =
    uiState === 'IDLE_HAS_KEY' ||
    uiState === 'DELETE_CONFIRM_OPEN' ||
    uiState === 'DELETING';

  const showInputForm =
    uiState === 'IDLE_NO_KEY' ||
    uiState === 'REPLACE_MODE' ||
    uiState === 'SAVING';

  const isSaving = uiState === 'SAVING';
  const isReplaceMode = uiState === 'REPLACE_MODE';

  const inputBorderStyle = (): string => {
    if (error) return '1px solid #DC2626';
    if (isFocused) return '1px solid #629584';
    return '1px solid #DFE1E6';
  };

  const inputBoxShadow = (): string => {
    if (error) return '0 0 0 3px #FEF2F2';
    if (isFocused) return '0 0 0 3px #E8F5F0';
    return 'none';
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#2C3E50', fontFamily: "'Plus Jakarta Sans', 'Noto Sans KR', sans-serif" }}>
            AI 설정
          </div>
          <div style={{ fontSize: 12, fontWeight: 400, color: '#5A6B7F', marginTop: 4 }}>
            Gemini API 키를 등록하면 마크다운을 티켓으로 자동 변환할 수 있습니다.
          </div>
        </div>
        <div style={{ fontSize: 12, color: '#8993A4' }}>불러오는 중...</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Section Header */}
      <div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: '#2C3E50',
            fontFamily: "'Plus Jakarta Sans', 'Noto Sans KR', sans-serif",
          }}
        >
          AI 설정
        </div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 400,
            color: '#5A6B7F',
            marginTop: 4,
          }}
        >
          Gemini API 키를 등록하면 마크다운을 티켓으로 자동 변환할 수 있습니다.
        </div>
      </div>

      {/* Key Status Card — shown when key EXISTS */}
      {showKeyCard && keyMeta && (
        <div
          style={{
            border: '1px solid #DFE1E6',
            borderRadius: 8,
            padding: 16,
            background: '#fff',
          }}
        >
          <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#5A6B7F' }}>등록된 API 키</span>
            <span style={{ fontSize: 12, fontWeight: 400, color: '#2C3E50', fontFamily: 'monospace' }}>
              {keyMeta.maskedKey}
            </span>
          </div>
          <div style={{ fontSize: 11, fontWeight: 400, color: '#8993A4', marginBottom: 12 }}>
            마지막 수정 {formattedDate}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => setUiState('REPLACE_MODE')}
              disabled={uiState === 'DELETING'}
              style={{
                background: 'transparent',
                border: '1px solid #DFE1E6',
                color: '#5A6B7F',
                borderRadius: 6,
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: 500,
                cursor: uiState === 'DELETING' ? 'not-allowed' : 'pointer',
                opacity: uiState === 'DELETING' ? 0.5 : 1,
              }}
            >
              키 교체
            </button>
            <button
              onClick={() => setUiState('DELETE_CONFIRM_OPEN')}
              disabled={uiState === 'DELETING'}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#DC2626',
                fontSize: 12,
                fontWeight: 500,
                cursor: uiState === 'DELETING' ? 'not-allowed' : 'pointer',
                opacity: uiState === 'DELETING' ? 0.5 : 1,
                padding: '6px 8px',
              }}
            >
              {uiState === 'DELETING' ? '삭제 중...' : 'API 키 삭제'}
            </button>
          </div>
        </div>
      )}

      {/* Key Input Form — shown when NO key OR user clicked 키 교체 */}
      {showInputForm && (
        <div>
          {/* Empty state — only when no key exists */}
          {uiState === 'IDLE_NO_KEY' && keyMeta === null && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#5A6B7F', marginBottom: 4 }}>
                API 키가 등록되지 않았습니다
              </div>
              <div style={{ fontSize: 12, fontWeight: 400, color: '#5A6B7F' }}>
                Gemini API 키를 등록하면 마크다운 파일을 티켓으로 자동 변환할 수 있습니다.
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label
              htmlFor="gemini-api-key"
              style={{ fontSize: 12, fontWeight: 700, color: '#2C3E50' }}
            >
              Gemini API 키
            </label>

            {/* Input with show/hide toggle */}
            <div style={{ position: 'relative' }}>
              <input
                id="gemini-api-key"
                type={showPassword ? 'text' : 'password'}
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  if (error) setError(null);
                }}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.preventDefault();
                }}
                placeholder="AIza로 시작하는 API 키를 입력하세요"
                disabled={isSaving}
                style={{
                  width: '100%',
                  height: 36,
                  padding: '8px 40px 8px 12px',
                  border: inputBorderStyle(),
                  borderRadius: 6,
                  fontSize: 12,
                  outline: 'none',
                  background: isSaving ? '#F8F9FB' : '#fff',
                  cursor: isSaving ? 'not-allowed' : 'text',
                  opacity: isSaving ? 0.7 : 1,
                  boxSizing: 'border-box',
                  boxShadow: inputBoxShadow(),
                  fontFamily: "'Noto Sans KR', sans-serif",
                  color: '#2C3E50',
                  transition: 'border 0.15s, box-shadow 0.15s',
                }}
              />
              {/* Eye toggle button */}
              <button
                type="button"
                aria-label={showPassword ? 'API 키 숨기기' : 'API 키 표시'}
                onClick={() => setShowPassword((prev) => !prev)}
                disabled={isSaving}
                style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'transparent',
                  border: 'none',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  color: '#8993A4',
                  padding: 0,
                }}
              >
                {showPassword ? (
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1={1} y1={1} x2={23} y2={23} />
                  </svg>
                ) : (
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx={12} cy={12} r={3} />
                  </svg>
                )}
              </button>
            </div>

            {/* Helper text */}
            <div style={{ fontSize: 11, color: '#8993A4', marginTop: 4 }}>
              키는 즉시 암호화되어 저장됩니다. 저장 후에는 전체 키를 다시 볼 수 없습니다.
            </div>

            {/* Inline error zone */}
            {error !== null && (
              <div role="alert" style={{ fontSize: 11, color: '#DC2626', marginTop: 4 }}>
                {error}
              </div>
            )}

            {/* Actions row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16 }}>
              <button
                type="button"
                onClick={handleSave}
                disabled={inputValue.trim() === '' || isSaving}
                aria-busy={isSaving ? 'true' : undefined}
                style={{
                  background: '#629584',
                  color: '#fff',
                  borderRadius: 6,
                  padding: '8px 20px',
                  fontSize: 12,
                  fontWeight: 600,
                  border: 'none',
                  cursor: inputValue.trim() === '' || isSaving ? 'not-allowed' : 'pointer',
                  opacity: inputValue.trim() === '' || isSaving ? 0.45 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'background 0.15s, opacity 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (inputValue.trim() !== '' && !isSaving) {
                    (e.currentTarget as HTMLButtonElement).style.background = '#527D6F';
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = '#629584';
                }}
              >
                {isSaving && (
                  <span
                    style={{
                      display: 'inline-block',
                      width: 14,
                      height: 14,
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: '#fff',
                      borderRadius: '50%',
                      animation: 'spin 0.6s linear infinite',
                    }}
                  />
                )}
                {isSaving ? '확인 중...' : 'API 키 저장'}
              </button>

              {/* Cancel button — only in REPLACE_MODE */}
              {isReplaceMode && (
                <button
                  type="button"
                  onClick={() => {
                    setUiState('IDLE_HAS_KEY');
                    setInputValue('');
                    setError(null);
                  }}
                  style={{
                    background: 'transparent',
                    border: '1px solid #DFE1E6',
                    color: '#5A6B7F',
                    borderRadius: 6,
                    padding: '8px 16px',
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  취소
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={uiState === 'DELETE_CONFIRM_OPEN'}
        title="API 키를 삭제하시겠습니까?"
        message="삭제 후 AI 기능을 사용하려면 새 키를 다시 등록해야 합니다."
        confirmLabel="API 키 삭제"
        confirmVariant="danger"
        onConfirm={handleDelete}
        onCancel={() => setUiState('IDLE_HAS_KEY')}
      />

      {/* Spin animation */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
