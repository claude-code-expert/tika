import { redirect } from 'next/navigation';
import { auth, signIn } from '@/lib/auth';

export default async function LoginPage() {
  let session = null;
  try {
    session = await auth();
  } catch (err) {
    console.error('[login] auth() 에러:', err);
  }
  if (session?.user) redirect('/');

  return (
    <div className="min-h-screen bg-[#F8F9FB]" style={{ fontFamily: "'Plus Jakarta Sans', 'Noto Sans KR', sans-serif" }}>
      {/* Hero */}
      <section className="flex flex-col items-center px-4 pt-20 pb-16 text-center">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-[#629584] text-2xl font-bold text-white shadow-md">
          T
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-[#2C3E50]">Tika</h1>
        <p className="mt-3 max-w-md text-lg text-[#5A6B7F]">
          직관적인 칸반 보드로 할 일을 관리하세요
        </p>

        {/* Feature pills */}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <span className="rounded-full border border-[#DFE1E6] bg-white px-3 py-1 text-xs font-medium text-[#5A6B7F]">
            100% 무료
          </span>
          <span className="rounded-full border border-[#DFE1E6] bg-white px-3 py-1 text-xs font-medium text-[#5A6B7F]">
            오픈소스
          </span>
          <span className="rounded-full border border-[#DFE1E6] bg-white px-3 py-1 text-xs font-medium text-[#5A6B7F]">
            구글 로그인
          </span>
          <span className="rounded-full border border-[#DFE1E6] bg-white px-3 py-1 text-xs font-medium text-[#5A6B7F]">
            직관적 인터페이스
          </span>
        </div>

        {/* Google Sign-in CTA */}
        <form
          className="mt-8"
          action={async () => {
            'use server';
            await signIn('google', { redirectTo: '/' });
          }}
        >
          <button
            type="submit"
            className="flex items-center gap-3 rounded-lg bg-[#629584] px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#527D6F] focus:outline-none focus:ring-2 focus:ring-[#629584] focus:ring-offset-2"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google로 시작하기
          </button>
        </form>
      </section>

      {/* Feature Showcase */}
      <section className="mx-auto max-w-4xl px-4 pb-20">
        <div className="grid gap-6 md:grid-cols-3">
          {/* Dashboard */}
          <div className="rounded-xl border border-[#DFE1E6] bg-white p-5 shadow-sm">
            <div className="mb-4 overflow-hidden rounded-lg border border-[#E8EDF2] bg-[#E8EDF2] p-3">
              <div className="flex gap-2">
                <div className="flex-1">
                  <div className="mb-2 h-3 w-10 rounded-sm bg-[#DBEAFE]" />
                  <div className="space-y-1.5">
                    <div className="h-8 rounded bg-white shadow-sm" />
                    <div className="h-8 rounded bg-white shadow-sm" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="mb-2 h-3 w-14 rounded-sm bg-[#FEF3C7]" />
                  <div className="space-y-1.5">
                    <div className="h-8 rounded bg-white shadow-sm" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="mb-2 h-3 w-8 rounded-sm bg-[#D1FAE5]" />
                  <div className="space-y-1.5">
                    <div className="h-8 rounded bg-white shadow-sm" />
                    <div className="h-8 rounded bg-white shadow-sm" />
                    <div className="h-8 rounded bg-white shadow-sm" />
                  </div>
                </div>
              </div>
            </div>
            <h3 className="text-sm font-bold text-[#2C3E50]">칸반 대시보드</h3>
            <p className="mt-1 text-xs leading-relaxed text-[#5A6B7F]">
              TODO, In Progress, Done 칼럼에서 업무 현황을 한눈에 파악
            </p>
          </div>

          {/* Ticket Creation */}
          <div className="rounded-xl border border-[#DFE1E6] bg-white p-5 shadow-sm">
            <div className="mb-4 overflow-hidden rounded-lg border border-[#E8EDF2] bg-[#F8F9FB] p-3">
              <div className="space-y-2">
                <div className="h-3 w-12 rounded-sm bg-[#DFE1E6]" />
                <div className="h-6 rounded border border-[#DFE1E6] bg-white" />
                <div className="flex gap-2">
                  <div className="h-5 w-14 rounded-sm bg-[#E8F5F0]" />
                  <div className="h-5 w-12 rounded-sm bg-[#FEF3C7]" />
                </div>
                <div className="h-3 w-16 rounded-sm bg-[#DFE1E6]" />
                <div className="h-10 rounded border border-[#DFE1E6] bg-white" />
                <div className="ml-auto h-6 w-14 rounded bg-[#629584]" />
              </div>
            </div>
            <h3 className="text-sm font-bold text-[#2C3E50]">간편한 티켓 생성</h3>
            <p className="mt-1 text-xs leading-relaxed text-[#5A6B7F]">
              제목, 우선순위, 마감일만으로 빠르게 업무를 등록
            </p>
          </div>

          {/* Drag & Drop */}
          <div className="rounded-xl border border-[#DFE1E6] bg-white p-5 shadow-sm">
            <div className="mb-4 overflow-hidden rounded-lg border border-[#E8EDF2] bg-[#E8EDF2] p-3">
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <div className="mb-2 h-3 w-10 rounded-sm bg-[#DBEAFE]" />
                  <div className="rounded border-2 border-dashed border-[#629584] bg-[#E8F5F0] p-1.5 opacity-50">
                    <div className="h-5 rounded bg-white" />
                  </div>
                </div>
                <svg className="h-5 w-5 shrink-0 text-[#629584]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                <div className="flex-1">
                  <div className="mb-2 h-3 w-14 rounded-sm bg-[#FEF3C7]" />
                  <div className="space-y-1.5">
                    <div className="h-5 rounded bg-white shadow-sm" />
                    <div className="rounded border-2 border-[#629584] bg-white p-1.5 shadow-md">
                      <div className="h-5 rounded bg-[#E8F5F0]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <h3 className="text-sm font-bold text-[#2C3E50]">드래그 앤 드롭</h3>
            <p className="mt-1 text-xs leading-relaxed text-[#5A6B7F]">
              카드를 끌어다 놓아 업무 상태를 직관적으로 변경
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="pb-8 text-center text-xs text-[#8993A4]">
        Tika &mdash; Free &amp; Open Source Kanban Board
      </footer>
    </div>
  );
}
