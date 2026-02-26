'use client';

import { useState, useEffect } from 'react';
import type { SectionProps } from './types';
import type { NotificationChannel, SlackConfig, TelegramConfig } from '@/types/index';

type TestStatus = 'idle' | 'loading' | 'success' | 'fail';

const fieldInputStyle: React.CSSProperties = {
  flex: 1,
  height: 36,
  padding: '0 12px',
  border: '1px solid #DFE1E6',
  borderRadius: 6,
  fontFamily: "'Noto Sans KR', sans-serif",
  fontSize: 12,
  color: '#2C3E50',
  outline: 'none',
  background: '#fff',
};

export function NotificationSection({ showToast }: SectionProps) {
  const [slackEnabled, setSlackEnabled] = useState(false);
  const [slackWebhookUrl, setSlackWebhookUrl] = useState('');
  const [slackTest, setSlackTest] = useState<TestStatus>('idle');
  const [slackSaving, setSlackSaving] = useState(false);

  const [teleEnabled, setTeleEnabled] = useState(false);
  const [teleBotToken, setTeleBotToken] = useState('');
  const [teleChatId, setTeleChatId] = useState('');
  const [teleTest, setTeleTest] = useState<TestStatus>('idle');
  const [teleSaving, setTeleSaving] = useState(false);

  useEffect(() => {
    fetch('/api/notifications')
      .then((r) => r.json())
      .then((data: { channels?: NotificationChannel[] }) => {
        for (const ch of data.channels ?? []) {
          if (ch.type === 'slack') {
            setSlackEnabled(ch.enabled);
            setSlackWebhookUrl((ch.config as SlackConfig).webhookUrl ?? '');
          } else if (ch.type === 'telegram') {
            setTeleEnabled(ch.enabled);
            setTeleBotToken((ch.config as TelegramConfig).botToken ?? '');
            setTeleChatId((ch.config as TelegramConfig).chatId ?? '');
          }
        }
      })
      .catch(() => {});
  }, []);

  async function saveChannel(type: 'slack' | 'telegram') {
    const body =
      type === 'slack'
        ? { config: { webhookUrl: slackWebhookUrl }, enabled: slackEnabled }
        : { config: { botToken: teleBotToken, chatId: teleChatId }, enabled: teleEnabled };

    if (type === 'slack') setSlackSaving(true);
    else setTeleSaving(true);

    try {
      const res = await fetch(`/api/notifications/${type}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: { message?: string } };
        showToast(data.error?.message ?? '저장 실패', 'fail');
      } else {
        showToast(`${type === 'slack' ? 'Slack' : 'Telegram'} 설정이 저장되었습니다`, 'success');
      }
    } catch {
      showToast('저장 중 오류가 발생했습니다', 'fail');
    } finally {
      if (type === 'slack') setSlackSaving(false);
      else setTeleSaving(false);
    }
  }

  async function testChannel(type: 'slack' | 'telegram') {
    if (type === 'slack') setSlackTest('loading');
    else setTeleTest('loading');

    const testBody =
      type === 'slack'
        ? { webhookUrl: slackWebhookUrl }
        : { botToken: teleBotToken, chatId: teleChatId };

    try {
      const res = await fetch(`/api/notifications/${type}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testBody),
      });
      const data = await res.json().catch(() => ({})) as { error?: { message?: string } };
      const ok = res.ok;
      if (type === 'slack') setSlackTest(ok ? 'success' : 'fail');
      else setTeleTest(ok ? 'success' : 'fail');
      showToast(
        ok ? '테스트 메시지가 성공적으로 발송되었습니다.' : (data.error?.message ?? '발송 실패 — 설정값을 확인해주세요.'),
        ok ? 'success' : 'fail',
      );
      setTimeout(() => {
        if (type === 'slack') setSlackTest('idle');
        else setTeleTest('idle');
      }, 2500);
    } catch {
      if (type === 'slack') setSlackTest('fail');
      else setTeleTest('fail');
      showToast('테스트 발송 중 오류가 발생했습니다', 'fail');
      setTimeout(() => {
        if (type === 'slack') setSlackTest('idle');
        else setTeleTest('idle');
      }, 2500);
    }
  }

  function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 12, color: '#8993A4', minWidth: 24 }}>{on ? 'ON' : 'OFF'}</span>
        <button
          onClick={onToggle}
          aria-pressed={on}
          style={{ width: 40, height: 22, borderRadius: 11, background: on ? '#629584' : '#C4C9D1', position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0, border: 'none', padding: 0 }}
        >
          <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: on ? 20 : 2, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,.15)', display: 'block' }} />
        </button>
      </div>
    );
  }

  function testBtnStyle(status: TestStatus): React.CSSProperties {
    if (status === 'success') return { background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#059669' };
    if (status === 'fail') return { background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626' };
    return { background: '#fff', border: '1px solid #DFE1E6', color: '#5A6B7F' };
  }

  const cardStyle: React.CSSProperties = {
    background: '#fff',
    border: '1px solid #DFE1E6',
    borderRadius: 8,
    padding: 20,
    marginBottom: 12,
  };

  const btnBase: React.CSSProperties = {
    height: 32,
    padding: '0 14px',
    borderRadius: 6,
    fontFamily: "'Noto Sans KR', sans-serif",
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
  };

  return (
    <div>
      <div style={{ marginBottom: 6 }}>
        <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 18, fontWeight: 600, color: '#2C3E50' }}>
          알림 채널 설정
        </h2>
      </div>
      <p style={{ fontSize: 12, color: '#8993A4', marginBottom: 20, lineHeight: 1.6 }}>
        마감일 D-1 알림을 수신할 채널을 설정합니다. Slack과 Telegram 각각 하나씩, 최대 2개 채널을 사용할 수 있습니다.
      </p>

      {/* Slack */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: '#4A154B', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="#fff">
                <path d="M14.5 2a2.5 2.5 0 0 0 0 5H17V4.5A2.5 2.5 0 0 0 14.5 2zM7 7a2.5 2.5 0 0 1 0 5h-2.5a2.5 2.5 0 0 1 0-5H7zm2.5 7a2.5 2.5 0 0 0-5 0V16.5a2.5 2.5 0 0 0 5 0V14zm5 2.5a2.5 2.5 0 0 1 5 0v2.5a2.5 2.5 0 0 1-5 0v-2.5zm2.5-9.5a2.5 2.5 0 0 0 0 5h2.5a2.5 2.5 0 0 0 0-5H17zm-7 7a2.5 2.5 0 0 0 0 5h2.5v-2.5a2.5 2.5 0 0 0-2.5-2.5z" />
              </svg>
            </div>
            <span style={{ fontSize: 16, fontWeight: 600, color: '#2C3E50' }}>Slack</span>
          </div>
          <Toggle on={slackEnabled} onToggle={() => setSlackEnabled((v) => !v)} />
        </div>
        <p style={{ fontSize: 12, color: '#8993A4', marginBottom: 16, lineHeight: 1.5 }}>
          Incoming Webhook을 통해 마감 알림을 Slack 채널로 전송합니다.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ minWidth: 110, fontSize: 12, color: '#5A6B7F', fontWeight: 500, flexShrink: 0 }}>Webhook URL</span>
            <input
              style={fieldInputStyle}
              type="text"
              value={slackWebhookUrl}
              onChange={(e) => setSlackWebhookUrl(e.target.value)}
              placeholder="https://hooks.slack.com/services/T.../B.../..."
            />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <button
            onClick={() => testChannel('slack')}
            disabled={slackTest === 'loading'}
            style={{ ...btnBase, ...testBtnStyle(slackTest), border: testBtnStyle(slackTest).border as string }}
          >
            {slackTest === 'loading' ? (
              <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid #DFE1E6', borderTopColor: '#629584', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
            ) : (
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="m22 2-7 20-4-9-9-4z" /><path d="M22 2 11 13" />
              </svg>
            )}
            {slackTest === 'loading' ? '발송 중...' : slackTest === 'success' ? '✓ 테스트 성공' : slackTest === 'fail' ? '✕ 발송 실패' : '테스트 발송'}
          </button>
          <button
            onClick={() => saveChannel('slack')}
            disabled={slackSaving}
            style={{ ...btnBase, background: '#629584', color: '#fff', border: 'none', opacity: slackSaving ? 0.6 : 1 }}
          >
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
            </svg>
            {slackSaving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>

      {/* Telegram */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: '#0088CC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="m22 2-7 20-4-9-9-4z" /><path d="M22 2 11 13" />
              </svg>
            </div>
            <span style={{ fontSize: 16, fontWeight: 600, color: '#2C3E50' }}>Telegram</span>
          </div>
          <Toggle on={teleEnabled} onToggle={() => setTeleEnabled((v) => !v)} />
        </div>
        <p style={{ fontSize: 12, color: '#8993A4', marginBottom: 16, lineHeight: 1.5 }}>
          Telegram Bot API를 통해 마감 알림을 채팅방으로 전송합니다.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ minWidth: 110, fontSize: 12, color: '#5A6B7F', fontWeight: 500, flexShrink: 0 }}>Bot Token</span>
            <input
              style={fieldInputStyle}
              type="text"
              value={teleBotToken}
              onChange={(e) => setTeleBotToken(e.target.value)}
              placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyz"
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ minWidth: 110, fontSize: 12, color: '#5A6B7F', fontWeight: 500, flexShrink: 0 }}>Chat ID</span>
            <input
              style={fieldInputStyle}
              type="text"
              value={teleChatId}
              onChange={(e) => setTeleChatId(e.target.value)}
              placeholder="@channel_name 또는 -1001234567890"
            />
          </div>
        </div>
        <div style={{ fontSize: 11, color: '#8993A4', marginBottom: 16, paddingLeft: 122 }}>
          @BotFather에서 봇을 생성하고 토큰을 발급받으세요.
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <button
            onClick={() => testChannel('telegram')}
            disabled={teleTest === 'loading'}
            style={{ ...btnBase, ...testBtnStyle(teleTest), border: testBtnStyle(teleTest).border as string }}
          >
            {teleTest === 'loading' ? (
              <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid #DFE1E6', borderTopColor: '#629584', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
            ) : (
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="m22 2-7 20-4-9-9-4z" /><path d="M22 2 11 13" />
              </svg>
            )}
            {teleTest === 'loading' ? '발송 중...' : teleTest === 'success' ? '✓ 테스트 성공' : teleTest === 'fail' ? '✕ 발송 실패' : '테스트 발송'}
          </button>
          <button
            onClick={() => saveChannel('telegram')}
            disabled={teleSaving}
            style={{ ...btnBase, background: '#629584', color: '#fff', border: 'none', opacity: teleSaving ? 0.6 : 1 }}
          >
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
            </svg>
            {teleSaving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
