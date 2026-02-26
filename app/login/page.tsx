import { redirect } from 'next/navigation';
import { auth, signIn } from '@/lib/auth';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  let session = null;
  try {
    session = await auth();
  } catch (err) {
    console.error('[login] auth() 에러:', err);
  }
  if (session?.user) redirect('/');

  const { error } = await searchParams;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '24px 16px',
        background: '#F8F9FB',
        fontFamily: "'Noto Sans KR', 'Plus Jakarta Sans', sans-serif",
        position: 'relative',
      }}
    >
      {/* Login card */}
      <div
        style={{
          maxWidth: 400,
          width: '100%',
          background: '#ffffff',
          borderRadius: 12,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          padding: '48px 40px',
          textAlign: 'center',
          animation: 'cardIn 0.4s ease',
        }}
      >
        {/* Logo */}
        <div
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 28 }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: '#629584',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 22,
              fontWeight: 700,
              boxShadow: '0 4px 12px rgba(98,149,132,.35)',
              flexShrink: 0,
            }}
          >
            T
          </div>
          <span
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 28,
              fontWeight: 700,
              color: '#2C3E50',
              letterSpacing: '-0.5px',
            }}
          >
            Tika
          </span>
        </div>

        {/* Description */}
        <p
          style={{
            fontSize: 14,
            color: '#5A6B7F',
            lineHeight: 1.7,
            marginBottom: 32,
          }}
        >
          <strong style={{ color: '#629584', fontWeight: 600 }}>칸반 보드</strong>로 할 일을
          관리하세요.
          <br />
          Goal부터 Task까지, 체계적으로 계획하고 실행할 수 있습니다.
        </p>

        {/* Google login button */}
        <form
          action={async () => {
            'use server';
            await signIn('google', { redirectTo: '/' });
          }}
        >
          <button
            type="submit"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              width: '100%',
              height: 48,
              border: '1px solid #DFE1E6',
              borderRadius: 8,
              background: '#fff',
              fontFamily: "'Noto Sans KR', sans-serif",
              fontSize: 14,
              fontWeight: 500,
              color: '#2C3E50',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {/* Google full-color logo */}
            <svg width={20} height={20} viewBox="0 0 48 48" aria-hidden="true" style={{ flexShrink: 0 }}>
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
            </svg>
            Google로 로그인
          </button>
        </form>

        {/* Error state */}
        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginTop: 16,
              padding: '10px 14px',
              borderRadius: 6,
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              fontSize: 12,
              color: '#DC2626',
              textAlign: 'left',
            }}
          >
            <svg
              width={16}
              height={16}
              viewBox="0 0 24 24"
              fill="none"
              stroke="#DC2626"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ flexShrink: 0 }}
            >
              <circle cx={12} cy={12} r={10} />
              <line x1={12} x2={12} y1={8} y2={12} />
              <line x1={12} x2={12.01} y1={16} y2={16} />
            </svg>
            {error === 'AccessDenied'
              ? '접근이 거부되었습니다. 다시 시도해주세요.'
              : '인증에 실패했습니다. 다시 시도해주세요.'}
          </div>
        )}

        {/* Feature hints */}
        <div
          style={{
            display: 'flex',
            gap: 16,
            justifyContent: 'center',
            marginTop: 28,
            flexWrap: 'wrap',
          }}
        >
          {['칸반 보드', '이슈 계층', '마감일 알림'].map((feat) => (
            <span
              key={feat}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#8993A4' }}
            >
              <span
                style={{ width: 6, height: 6, borderRadius: '50%', background: '#629584', flexShrink: 0 }}
              />
              {feat}
            </span>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          position: 'absolute',
          bottom: 24,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontSize: 11,
          color: '#8993A4',
        }}
      >
        © 2026 Tika · All rights reserved
      </div>

      <style>{`
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
