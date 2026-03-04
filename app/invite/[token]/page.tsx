import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { InviteAcceptClient } from './InviteAcceptClient';

interface InvitePreview {
  workspaceName: string;
  inviterName: string;
  role: 'MEMBER' | 'VIEWER';
  status: string;
  expiresAt: string;
  emailHint: string;
}

interface ErrorResponse {
  error: { code: string; message: string };
  status?: string;
}

async function fetchInvitePreview(token: string): Promise<InvitePreview | ErrorResponse> {
  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/invites/${token}`, { cache: 'no-store' });
  return res.json() as Promise<InvitePreview | ErrorResponse>;
}

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const session = await auth();

  const data = await fetchInvitePreview(token);
  const isError = 'error' in data;

  if (!isError && data.status === 'ACCEPTED') {
    // Already accepted — redirect to workspaces list
    redirect('/');
  }

  const roleLabel = !isError ? ((data as InvitePreview).role === 'MEMBER' ? '멤버' : '뷰어') : '뷰어';

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F8F9FB',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        fontFamily: "'Noto Sans KR', sans-serif",
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 16px 48px rgba(0,0,0,.1)',
          padding: 40,
          maxWidth: 440,
          width: '100%',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32 }}>
          <div
            style={{
              width: 36, height: 36,
              background: '#629584',
              borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700, fontSize: 16,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            T
          </div>
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 18, color: '#2C3E50' }}>
            tika
          </span>
        </div>

        {isError ? (
          /* Error state */
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>
              {(data as ErrorResponse).error.code === 'INVITE_EXPIRED' ? '⏰' : '❌'}
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 600, color: '#2C3E50', marginBottom: 8 }}>
              {(data as ErrorResponse).error.code === 'INVITE_EXPIRED' ? '초대가 만료되었습니다' : '초대를 찾을 수 없습니다'}
            </h1>
            <p style={{ fontSize: 13, color: '#8993A4', marginBottom: 24, lineHeight: 1.6 }}>
              {(data as ErrorResponse).error.message}
            </p>
            <Link
              href="/"
              style={{
                display: 'inline-flex', alignItems: 'center',
                padding: '10px 24px',
                background: '#629584', color: '#fff',
                borderRadius: 8, fontSize: 13, fontWeight: 500,
                textDecoration: 'none',
              }}
            >
              홈으로 이동
            </Link>
          </div>
        ) : (
          /* Invite card */
          <>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#2C3E50', marginBottom: 6, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              팀에 초대받았습니다
            </h1>
            <p style={{ fontSize: 13, color: '#8993A4', marginBottom: 28, lineHeight: 1.6 }}>
              {(data as InvitePreview).inviterName}님이{' '}
              <strong style={{ color: '#2C3E50' }}>{(data as InvitePreview).workspaceName}</strong>{' '}
              워크스페이스에 <strong style={{ color: '#2C3E50' }}>{roleLabel}</strong>로 초대했습니다.
            </p>

            {/* Info rows */}
            <div style={{ background: '#F8F9FB', borderRadius: 8, padding: '16px', marginBottom: 28, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <InfoRow label="워크스페이스" value={(data as InvitePreview).workspaceName} />
              <InfoRow label="초대자" value={(data as InvitePreview).inviterName} />
              <InfoRow label="역할" value={roleLabel} />
              <InfoRow label="초대 이메일" value={(data as InvitePreview).emailHint} />
              <InfoRow
                label="만료일"
                value={new Date((data as InvitePreview).expiresAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
              />
            </div>

            <InviteAcceptClient
              token={token}
              isLoggedIn={!!session?.user}
              userEmail={(session?.user?.email) ?? null}
            />
          </>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 12, color: '#8993A4', width: 80, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, color: '#2C3E50', fontWeight: 500 }}>{value}</span>
    </div>
  );
}
