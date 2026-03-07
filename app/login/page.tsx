import { signIn } from '@/lib/auth';
import { getLandingStats } from '@/db/queries/users';

const AVATAR_COLORS = ['#7EB4A2', '#60A5FA', '#A78BFA', '#F97316', '#EC4899', '#14B8A6'];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const { totalUsers, recentUsers } = await getLandingStats();

  return (
    <div className="min-h-screen bg-[#F8F9FB]" style={{ fontFamily: "'Plus Jakarta Sans', 'Noto Sans KR', sans-serif" }}>
      {/* Hero */}
      <section
        className="relative"
        style={{
          width: 1200,
          maxWidth: '100%',
          margin: '0 auto',
          padding: '30px 0 50px',
        }}
      >
        {/* Hero SVG */}
        <div style={{ position: 'relative', overflow: 'hidden' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/tika-hero2.svg" alt="Tika - Plan Simply. Ship Boldly." width={1200} height={630} style={{ width: '100%', height: 'auto', display: 'block' }} />
          {/* Edge fade overlays */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
            boxShadow: 'inset 0 40px 30px -10px #F8F9FB, inset 0 -40px 30px -10px #F8F9FB, inset 40px 0 30px -10px #F8F9FB, inset -40px 0 30px -10px #F8F9FB',
          }} />
        </div>

        {/* Google Sign-in — overlays SVG CTA button (x:60 y:408 w:192 h:46 in 1200x630 viewBox) */}
        <form
          action={async () => {
            'use server';
            await signIn('google', { redirectTo: '/' });
          }}
          style={{
            position: 'absolute',
            left: 'calc(5% - 5px)',
            top: 'calc(64.8% - 15px)',
            width: 'calc(16% + 10px)',
            height: 'calc(7.3% + 10px)',
          }}
        >
          <button
            type="submit"
            style={{
              width: '100%',
              height: '100%',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              borderRadius: 8,
            }}
            aria-label="Google로 시작하기"
          />
        </form>

        {/* Trust indicators — real data from DB */}
        {totalUsers > 0 && (
          <div
            style={{
              position: 'absolute',
              left: '5%',
              top: '76%',
              display: 'flex',
              alignItems: 'center',
              gap: 0,
            }}
          >
            {recentUsers.map((user, i) => (
              <div
                key={i}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: user.bgcolor || AVATAR_COLORS[i % AVATAR_COLORS.length],
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#fff',
                  border: '2px solid #F8F9FB',
                  marginLeft: i > 0 ? -6 : 0,
                  zIndex: recentUsers.length - i,
                  position: 'relative',
                }}
              >
                {user.name.charAt(0)}
              </div>
            ))}
            <span
              style={{
                marginLeft: 8,
                fontSize: 13,
                color: '#5A6B7F',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              {totalUsers.toLocaleString()}팀이 사용 중
            </span>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div
            className="flex items-center gap-2 rounded-md border border-[#FECACA] bg-[#FEF2F2] px-4 py-2.5 text-sm text-[#DC2626]"
            style={{ position: 'absolute', left: '5%', top: '73%' }}
          >
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx={12} cy={12} r={10} />
              <line x1={12} x2={12} y1={8} y2={12} />
              <line x1={12} x2={12.01} y1={16} y2={16} />
            </svg>
            {error === 'AccessDenied'
              ? '접근이 거부되었습니다. 다시 시도해주세요.'
              : '인증에 실패했습니다. 다시 시도해주세요.'}
          </div>
        )}
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

      {/* Divider */}
      <div className="mx-auto max-w-4xl px-4">
        <hr className="border-[#DFE1E6]" />
      </div>

      {/* Team */}
      <section className="mx-auto max-w-4xl px-4 pt-14 pb-14">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#EDE9FE] text-[#7C3AED]">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>
          </div>
          <div>
            <h2 className="text-base font-bold text-[#2C3E50]">Tika Team</h2>
            <p className="text-xs text-[#5A6B7F]">워크스페이스 기반 팀 협업 + MCP 자동화</p>
          </div>
          <span className="rounded-full bg-[#F3F4F6] px-2 py-0.5 text-[11px] font-semibold text-[#8993A4]">Coming Soon</span>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-[#629584] bg-[#E8F5F0] p-4">
            <span className="mb-2 inline-block rounded-full bg-[#EDE9FE] px-2 py-0.5 text-[11px] font-semibold text-[#7C3AED]">Core</span>
            <h3 className="text-sm font-bold text-[#3D6B5E]">MCP 티켓 자동화</h3>
            <p className="mt-1 text-xs leading-relaxed text-[#5A6B7F]">AI 에이전트가 MCP를 통해 티켓 생성, 상태 변경, 우선순위 조정을 자동 수행</p>
          </div>
          <div className="rounded-lg border border-[#DFE1E6] bg-white p-4">
            <h3 className="text-sm font-bold text-[#2C3E50]">워크스페이스</h3>
            <p className="mt-1 text-xs leading-relaxed text-[#5A6B7F]">프로젝트별 독립 보드 개설, 멤버 초대 및 역할 관리 (Owner / Member / Viewer)</p>
          </div>
          <div className="rounded-lg border border-[#DFE1E6] bg-white p-4">
            <h3 className="text-sm font-bold text-[#2C3E50]">진척 대시보드</h3>
            <p className="mt-1 text-xs leading-relaxed text-[#5A6B7F]">팀 전체 업무 현황, 멤버별 진행률, 마감일 알림을 한눈에 확인</p>
          </div>
          <div className="rounded-lg border border-[#DFE1E6] bg-white p-4">
            <h3 className="text-sm font-bold text-[#2C3E50]">댓글 & 라벨</h3>
            <p className="mt-1 text-xs leading-relaxed text-[#5A6B7F]">티켓 내 댓글로 소통하고, 색상 라벨로 업무를 분류</p>
          </div>
          <div className="rounded-lg border border-[#DFE1E6] bg-white p-4">
            <h3 className="text-sm font-bold text-[#2C3E50]">알림 연동</h3>
            <p className="mt-1 text-xs leading-relaxed text-[#5A6B7F]">마감 D-1 자동 알림을 Slack, Telegram 채널로 발송</p>
          </div>
          <div className="rounded-lg border border-[#DFE1E6] bg-white p-4">
            <h3 className="text-sm font-bold text-[#2C3E50]">파일 첨부</h3>
            <p className="mt-1 text-xs leading-relaxed text-[#5A6B7F]">티켓에 문서, 이미지를 첨부하고 팀원과 공유</p>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="mx-auto max-w-4xl px-4">
        <hr className="border-[#DFE1E6]" />
      </div>

      {/* Enterprise */}
      <section className="mx-auto max-w-4xl px-4 pt-14 pb-14">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#FEE2E2] text-[#DC2626]">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" /><rect x="2" y="14" width="20" height="8" rx="2" /><line x1="6" y1="6" x2="6.01" y2="6" /><line x1="6" y1="18" x2="6.01" y2="18" /></svg>
          </div>
          <div>
            <h2 className="text-base font-bold text-[#2C3E50]">Tika Enterprise</h2>
            <p className="text-xs text-[#5A6B7F]">설치형 온프레미스 + 완전 커스터마이징</p>
          </div>
          <span className="rounded-full bg-[#F3F4F6] px-2 py-0.5 text-[11px] font-semibold text-[#8993A4]">Coming Soon</span>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-[#DFE1E6] bg-white p-4">
            <h3 className="text-sm font-bold text-[#2C3E50]">셀프 호스팅</h3>
            <p className="mt-1 text-xs leading-relaxed text-[#5A6B7F]">사내 서버 또는 프라이빗 클라우드에 직접 설치하여 데이터 완전 통제</p>
          </div>
          <div className="rounded-lg border border-[#DFE1E6] bg-white p-4">
            <h3 className="text-sm font-bold text-[#2C3E50]">SSO / SAML</h3>
            <p className="mt-1 text-xs leading-relaxed text-[#5A6B7F]">사내 IdP(Okta, Azure AD 등)와 싱글 사인온 연동으로 보안 강화</p>
          </div>
          <div className="rounded-lg border border-[#DFE1E6] bg-white p-4">
            <h3 className="text-sm font-bold text-[#2C3E50]">커스텀 워크플로우</h3>
            <p className="mt-1 text-xs leading-relaxed text-[#5A6B7F]">동적 칼럼 관리로 팀에 맞는 고유 워크플로우를 구성</p>
          </div>
          <div className="rounded-lg border border-[#DFE1E6] bg-white p-4">
            <h3 className="text-sm font-bold text-[#2C3E50]">감사 로그</h3>
            <p className="mt-1 text-xs leading-relaxed text-[#5A6B7F]">모든 변경 이력을 추적하여 컴플라이언스 요구사항 충족</p>
          </div>
          <div className="rounded-lg border border-[#DFE1E6] bg-white p-4">
            <h3 className="text-sm font-bold text-[#2C3E50]">API & 웹훅</h3>
            <p className="mt-1 text-xs leading-relaxed text-[#5A6B7F]">REST API와 웹훅으로 CI/CD, 사내 시스템과 자유롭게 연동</p>
          </div>
          <div className="rounded-lg border border-[#DFE1E6] bg-white p-4">
            <h3 className="text-sm font-bold text-[#2C3E50]">SLA 지원</h3>
            <p className="mt-1 text-xs leading-relaxed text-[#5A6B7F]">전담 기술 지원, 온보딩, 마이그레이션 지원 제공</p>
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
