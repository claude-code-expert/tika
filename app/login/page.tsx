import type { Metadata } from 'next';
import { signIn } from '@/lib/auth';
import { getLandingStats } from '@/db/queries/users';
import { FaqSection } from './FaqSection';
import { ContactModal } from '@/components/ui/ContactModal';
import { NotifyModal } from '@/components/ui/NotifyModal';

export const metadata: Metadata = {
  title: '로그인',
  description: '티카에 로그인하여 칸반 보드로 업무를 관리하세요.',
};

const AVATAR_COLORS = ['#7EB4A2', '#60A5FA', '#A78BFA', '#F97316', '#EC4899', '#14B8A6'];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const { totalUsers, totalWorkspaces, recentUsers } = await getLandingStats();

  return (
    <div
      className="min-h-screen bg-[#F8F9FB]"
      style={{ fontFamily: "'Plus Jakarta Sans', 'Noto Sans KR', sans-serif" }}
    >
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
          <img
            src="/images/tika-hero3.svg"
            alt="Tika - Plan Simply. Ship Boldly."
            width={1200}
            height={630}
            style={{ width: '100%', height: 'auto', display: 'block' }}
          />
          {/* Edge fade overlays */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              boxShadow:
                'inset 0 40px 30px -10px #F8F9FB, inset 0 -40px 30px -10px #F8F9FB, inset 40px 0 30px -10px #F8F9FB, inset -40px 0 30px -10px #F8F9FB',
            }}
          />
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
            width: 'calc(13.2% + 10px)',
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
              총 {totalUsers.toLocaleString()}명, {totalWorkspaces.toLocaleString()}개의 워크스페이스가 사용중
            </span>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div
            className="flex items-center gap-2 rounded-md border border-[#FECACA] bg-[#FEF2F2] px-4 py-2.5 text-sm text-[#DC2626]"
            style={{ position: 'absolute', left: '5%', top: '73%' }}
          >
            <svg
              width={16}
              height={16}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
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
      </section>

      {/* Divider */}
      <div className="mx-auto max-w-[900px] px-6">
        <hr className="border-[#DFE1E6]" />
      </div>

      {/* Pain Points */}
      <section className="mx-auto max-w-[900px] px-6 py-[72px] text-center">
        <span className="mb-3.5 inline-block rounded-full bg-[#E8F5F0] px-2.5 py-[3px] text-[11px] font-bold tracking-[.08em] text-[#629584] uppercase">
          문제 제기
        </span>
        <h2 className="mb-2.5 text-[28px] font-extrabold text-[#2C3E50]">
          이런 불편함 겪고 계신가요?
        </h2>
        <p className="mx-auto max-w-[500px] text-[15px] text-[#5A6B7F]">
          복잡한 툴에 지쳐 정작 중요한 일에 집중하지 못하는 팀들을 위해 만들었습니다.
        </p>
        <div className="mt-10 grid gap-5 text-left md:grid-cols-3">
          <div className="rounded-xl border border-[#DFE1E6] bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,.04)]">
            <div className="mb-3.5 flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#FEE2E2] text-xl">
              😵
            </div>
            <h3 className="mb-1.5 text-[15px] font-bold text-[#2C3E50]">흩어진 할 일</h3>
            <p className="text-[13px] leading-relaxed text-[#5A6B7F]">
              슬랙, 노션, 엑셀에 분산된 태스크를 하나로 모으는 데 매일 30분을 낭비합니다.
            </p>
          </div>
          <div className="rounded-xl border border-[#DFE1E6] bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,.04)]">
            <div className="mb-3.5 flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#FEF3C7] text-xl">
              🌀
            </div>
            <h3 className="mb-1.5 text-[15px] font-bold text-[#2C3E50]">진행 상태 불투명</h3>
            <p className="text-[13px] leading-relaxed text-[#5A6B7F]">
              지금 팀에서 뭘 하고 있는지, 어디서 막혔는지 회의 전까지는 아무도 모릅니다.
            </p>
          </div>
          <div className="rounded-xl border border-[#DFE1E6] bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,.04)]">
            <div className="mb-3.5 flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#DBEAFE] text-xl">
              📅
            </div>
            <h3 className="mb-1.5 text-[15px] font-bold text-[#2C3E50]">맥락 없는 마감일</h3>
            <p className="text-[13px] leading-relaxed text-[#5A6B7F]">
              큰 목표와 세부 태스크가 연결되지 않아 우선순위를 잘못 잡고 마감을 놓칩니다.
            </p>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="mx-auto max-w-[900px] px-6">
        <hr className="border-[#DFE1E6]" />
      </div>

      {/* Features */}
      <section className="mx-auto max-w-[900px] px-6 py-[72px] text-center">
        <span className="mb-3.5 inline-block rounded-full bg-[#E8F5F0] px-2.5 py-[3px] text-[11px] font-bold tracking-[.08em] text-[#629584] uppercase">
          문제 해결책
        </span>
        <h2 className="mb-2.5 text-[28px] font-extrabold text-[#2C3E50]">Tika가 다른 이유</h2>
        <p className="mx-auto max-w-[500px] text-[15px] text-[#5A6B7F]">
          단순히 할 일을 적는 것을 넘어, 목표 → 실행 흐름 전체를 하나의 도구로 연결합니다.
        </p>
        <div className="mt-10 grid gap-5 text-left md:grid-cols-3">
          {/* Highlighted card */}
          <div className="rounded-xl border border-[#629584] bg-[#E8F5F0] p-6 shadow-[0_1px_4px_rgba(0,0,0,.04)]">
            <span className="mb-2.5 inline-block rounded-full bg-[#629584] px-2 py-[2px] text-[10px] font-bold text-white">
              Core
            </span>
            <h3 className="mb-1.5 text-[15px] font-bold text-[#1a4d3f]">Goal → Task 계층 구조</h3>
            <p className="text-[13px] leading-relaxed text-[#5A6B7F]">
              큰 목표(Goal)를 Story → Feature → Task로 분해. 모든 태스크가 왜 존재하는지 맥락이
              살아있습니다.
            </p>
          </div>
          <div className="rounded-xl border border-[#DFE1E6] bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,.04)] transition-shadow hover:border-[#629584] hover:shadow-[0_4px_16px_rgba(98,149,132,.12)]">
            <span className="mb-2.5 inline-block rounded-full bg-[#DBEAFE] px-2 py-[2px] text-[10px] font-bold text-[#1D4ED8]">
              UX
            </span>
            <h3 className="mb-1.5 text-[15px] font-bold text-[#2C3E50]">드래그 앤 드롭 칸반</h3>
            <p className="text-[13px] leading-relaxed text-[#5A6B7F]">
              Backlog → TODO → In Progress → Done. 카드 한 번 끌어다 놓으면 상태 변경 완료.
            </p>
          </div>
          <div className="rounded-xl border border-[#DFE1E6] bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,.04)] transition-shadow hover:border-[#629584] hover:shadow-[0_4px_16px_rgba(98,149,132,.12)]">
            <span className="mb-2.5 inline-block rounded-full bg-[#EDE9FE] px-2 py-[2px] text-[10px] font-bold text-[#7C3AED]">
              협업
            </span>
            <h3 className="mb-1.5 text-[15px] font-bold text-[#2C3E50]">팀 워크스페이스</h3>
            <p className="text-[13px] leading-relaxed text-[#5A6B7F]">
              멤버 초대, 역할(Owner · Member · Viewer) 관리, 진척 대시보드로 팀 전체 현황 한눈에.
            </p>
          </div>
          <div className="rounded-xl border border-[#DFE1E6] bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,.04)] transition-shadow hover:border-[#629584] hover:shadow-[0_4px_16px_rgba(98,149,132,.12)]">
            <span className="mb-2.5 inline-block rounded-full bg-[#FEF3C7] px-2 py-[2px] text-[10px] font-bold text-[#92400E]">
              생산성
            </span>
            <h3 className="mb-1.5 text-[15px] font-bold text-[#2C3E50]">체크리스트 &amp; 라벨</h3>
            <p className="text-[13px] leading-relaxed text-[#5A6B7F]">
              티켓 내 하위 작업을 체크리스트로 추적. 색상 라벨로 빠른 분류와 필터링.
            </p>
          </div>
          <div className="rounded-xl border border-[#DFE1E6] bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,.04)] transition-shadow hover:border-[#629584] hover:shadow-[0_4px_16px_rgba(98,149,132,.12)]">
            <span className="mb-2.5 inline-block rounded-full bg-[#D1FAE5] px-2 py-[2px] text-[10px] font-bold text-[#065F46]">
              분석
            </span>
            <h3 className="mb-1.5 text-[15px] font-bold text-[#2C3E50]">
              WBS &amp; 간트 차트 &amp; 팀 대시보드
            </h3>
            <p className="text-[13px] leading-relaxed text-[#5A6B7F]">
              업무 계층을 타임라인으로 시각화. 스프린트 번다운 차트로 팀 속도를 측정.
            </p>
          </div>
          <div className="rounded-xl border border-[#DFE1E6] bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,.04)] transition-shadow hover:border-[#629584] hover:shadow-[0_4px_16px_rgba(98,149,132,.12)]">
            <span className="mb-2.5 inline-block rounded-full bg-[#F3F4F6] px-2 py-[2px] text-[10px] font-bold text-[#5A6B7F]">
              예정
            </span>
            <h3 className="mb-1.5 text-[15px] font-bold text-[#2C3E50]">
              MCP · Slack · 텔레그램 자동화
            </h3>
            <p className="text-[13px] leading-relaxed text-[#5A6B7F]">
              AI 에이전트가 티켓을 자동 생성·변경. 마감 D-1 알림을 Slack · Telegram으로 발송.
            </p>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="mx-auto max-w-[900px] px-6">
        <hr className="border-[#DFE1E6]" />
      </div>

      {/* How to Use */}
      <section className="mx-auto max-w-[900px] px-6 py-[72px] text-center">
        <span className="mb-3.5 inline-block rounded-full bg-[#E8F5F0] px-2.5 py-[3px] text-[11px] font-bold tracking-[.08em] text-[#629584] uppercase">
          이용 방법
        </span>
        <h2 className="mb-2.5 text-[28px] font-extrabold text-[#2C3E50]">3단계로 바로 시작</h2>
        <p className="mx-auto max-w-[400px] text-[15px] text-[#5A6B7F]">
          설치 없이 브라우저에서 바로 시작하세요.
        </p>
        <div className="relative mt-11 grid gap-7 md:grid-cols-3 md:gap-0">
          {/* Connecting line (desktop only) */}
          <div
            className="absolute top-[22px] right-[16.6%] left-[16.6%] hidden h-0.5 md:block"
            style={{ background: 'linear-gradient(90deg, #E8F5F0, #629584, #E8F5F0)' }}
          />
          <div className="relative z-[1] px-4 text-center">
            <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full border-[3px] border-[#F8F9FB] bg-[#629584] text-base font-extrabold text-white shadow-[0_0_0_3px_#629584]">
              1
            </div>
            <h3 className="mb-1.5 text-sm font-bold text-[#2C3E50]">Google 로그인</h3>
            <p className="text-xs leading-relaxed text-[#5A6B7F]">
              계정 생성 없이 Google 계정으로 즉시 로그인. 개인 워크스페이스가 자동 생성됩니다.
            </p>
          </div>
          <div className="relative z-[1] px-4 text-center">
            <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full border-[3px] border-[#F8F9FB] bg-[#629584] text-base font-extrabold text-white shadow-[0_0_0_3px_#629584]">
              2
            </div>
            <h3 className="mb-1.5 text-sm font-bold text-[#2C3E50]">Goal 설정 &amp; 분해</h3>
            <p className="text-xs leading-relaxed text-[#5A6B7F]">
              이번 목표를 Goal로 만들고 Story → Feature → Task로 쪼개세요. 구조가 잡힙니다.
            </p>
          </div>
          <div className="relative z-[1] px-4 text-center">
            <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full border-[3px] border-[#F8F9FB] bg-[#629584] text-base font-extrabold text-white shadow-[0_0_0_3px_#629584]">
              3
            </div>
            <h3 className="mb-1.5 text-sm font-bold text-[#2C3E50]">보드에서 실행</h3>
            <p className="text-xs leading-relaxed text-[#5A6B7F]">
              칸반 보드에서 카드를 끌어 상태를 바꾸고, 팀원을 초대해 함께 진행하세요.
            </p>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="mx-auto max-w-[900px] px-6">
        <hr className="border-[#DFE1E6]" />
      </div>

      {/* Product Spotlight */}
      <section className="mx-auto max-w-[900px] px-6 py-[72px]">
        <div className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
          {/* Ticket detail mockup */}
          <div className="overflow-hidden rounded-[14px] border border-[#DFE1E6] bg-[#E8EDF2] shadow-[0_8px_32px_rgba(0,0,0,.08)]">
            <div className="flex items-center gap-1.5 border-b border-[#DFE1E6] bg-white px-4 py-2.5">
              <span className="text-[11px] text-[#8993A4]">티켓 상세 · API 엔드포인트 구현</span>
            </div>
            <div className="flex flex-col gap-2.5 p-3.5">
              {/* Breadcrumb */}
              <div className="flex flex-wrap items-center gap-[5px] text-[10px]">
                <span className="rounded bg-[#EDE9FE] px-[5px] py-px text-[9px] font-bold text-[#7C3AED]">
                  G
                </span>
                <span className="text-[#8993A4]">Tika 런칭 ›</span>
                <span className="rounded bg-[#DBEAFE] px-[5px] py-px text-[9px] font-bold text-[#1D4ED8]">
                  S
                </span>
                <span className="text-[#8993A4]">백엔드 구축 ›</span>
                <span className="rounded bg-[#D1FAE5] px-[5px] py-px text-[9px] font-bold text-[#065F46]">
                  F
                </span>
                <span className="text-[#8993A4]">티켓 API</span>
              </div>
              <div className="text-base font-bold text-[#2C3E50]">API 엔드포인트 구현</div>
              <div className="flex flex-wrap gap-1.5">
                <span className="rounded-[5px] bg-[#E8F5F0] px-2 py-[3px] text-[9px] font-bold text-[#629584]">
                  In Progress
                </span>
                <span className="rounded-[5px] bg-[#FEF3C7] px-2 py-[3px] text-[9px] font-bold text-[#92400E]">
                  HIGH
                </span>
                <span className="rounded-[5px] bg-[#F3F4F6] px-2 py-[3px] text-[9px] font-bold text-[#5A6B7F]">
                  마감 D-2
                </span>
              </div>
              {/* Checklist */}
              <div className="rounded-lg bg-[#F8F9FB] p-2.5 text-[11px]">
                <div className="mb-2 font-bold text-[#5A6B7F]">체크리스트 2/3</div>
                <div className="mb-[5px] flex items-center gap-1.5">
                  <span className="text-[#629584]">☑</span> GET /api/tickets 구현
                </div>
                <div className="mb-[5px] flex items-center gap-1.5">
                  <span className="text-[#629584]">☑</span> POST /api/tickets 구현
                </div>
                <div className="flex items-center gap-1.5 text-[#8993A4]">
                  <span>☐</span> PATCH /api/tickets/[id] 구현
                </div>
              </div>
              {/* Comment */}
              <div className="rounded-lg border border-[#DFE1E6] bg-white p-2.5 text-[11px] text-[#5A6B7F]">
                <div className="mb-[5px] flex items-center gap-1.5">
                  <div className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#629584] text-[9px] font-bold text-white">
                    K
                  </div>
                  <strong className="text-[11px] text-[#2C3E50]">김코드</strong>
                  <span className="text-[#8993A4]">방금 전</span>
                </div>
                PATCH도 오늘 안에 완료할게요 ✔
              </div>
            </div>
          </div>

          {/* Checklist description */}
          <div>
            <span className="mb-3.5 inline-block rounded-full bg-[#E8F5F0] px-2.5 py-[3px] text-[11px] font-bold tracking-[.08em] text-[#629584] uppercase">
              Product
            </span>
            <h2 className="mb-5 text-[28px] leading-tight font-extrabold text-[#2C3E50]">
              맥락이 살아있는
              <br />
              티켓 상세 페이지
            </h2>
            <ul className="flex flex-col gap-3.5">
              <li className="flex items-start gap-2.5 text-sm">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#629584] text-[11px] font-extrabold text-white">
                  ✓
                </div>
                <div>
                  <strong className="text-[#2C3E50]">계층 브레드크럼</strong>
                  <span className="mt-0.5 block text-xs text-[#5A6B7F]">
                    Goal부터 Feature까지 한눈에 — 이 태스크가 왜 존재하는지 항상 보입니다.
                  </span>
                </div>
              </li>
              <li className="flex items-start gap-2.5 text-sm">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#629584] text-[11px] font-extrabold text-white">
                  ✓
                </div>
                <div>
                  <strong className="text-[#2C3E50]">체크리스트 진행률</strong>
                  <span className="mt-0.5 block text-xs text-[#5A6B7F]">
                    하위 작업을 쪼개고 완료율을 실시간으로 추적하세요.
                  </span>
                </div>
              </li>
              <li className="flex items-start gap-2.5 text-sm">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#629584] text-[11px] font-extrabold text-white">
                  ✓
                </div>
                <div>
                  <strong className="text-[#2C3E50]">댓글 &amp; 담당자</strong>
                  <span className="mt-0.5 block text-xs text-[#5A6B7F]">
                    티켓 안에서 바로 소통. 팀원 멘션과 수정 이력 확인.
                  </span>
                </div>
              </li>
              <li className="flex items-start gap-2.5 text-sm">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#629584] text-[11px] font-extrabold text-white">
                  ✓
                </div>
                <div>
                  <strong className="text-[#2C3E50]">마감일 경고</strong>
                  <span className="mt-0.5 block text-xs text-[#5A6B7F]">
                    마감 D-3부터 경고 표시, 초과 시 빨간 테두리로 즉시 인지.
                  </span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="mx-auto max-w-[900px] px-6">
        <hr className="border-[#DFE1E6]" />
      </div>

      {/* Pricing */}
      <section className="mx-auto max-w-[1100px] px-6 py-[72px] text-center">
        <span className="mb-3.5 inline-block rounded-full bg-[#E8F5F0] px-2.5 py-[3px] text-[11px] font-bold tracking-[.08em] text-[#629584] uppercase">
          플랜
        </span>
        <h2 className="mb-2.5 text-[28px] font-extrabold text-[#2C3E50]">팀 규모에 맞는 플랜</h2>
        <p className="mx-auto max-w-[440px] text-[15px] text-[#5A6B7F]">
          개인부터 엔터프라이즈까지. 지금 시작은 언제나 무료.
        </p>
        <div className="mt-10 grid gap-4 text-left sm:grid-cols-2 lg:grid-cols-4">
          {/* Personal */}
          <div className="flex flex-col rounded-[14px] border-[1.5px] border-[#DFE1E6] bg-white p-6 transition-shadow hover:shadow-[0_8px_28px_rgba(0,0,0,.09)]">
            <span className="mb-3 inline-block self-start rounded-full bg-[#D1FAE5] px-2 py-[2px] text-[10px] font-bold text-[#065F46]">
              Free · 사용 가능
            </span>
            <div className="mb-1 text-[17px] font-extrabold text-[#2C3E50]">Personal</div>
            <div className="mb-4 text-xs leading-relaxed text-[#5A6B7F]">
              개인 생산성 도구로 지금 바로 시작
            </div>
            <form
              action={async () => {
                'use server';
                await signIn('google', { redirectTo: '/' });
              }}
            >
              <button
                type="submit"
                className="mb-5 w-full cursor-pointer rounded-lg border-[1.5px] border-[#DFE1E6] bg-white px-2.5 py-2.5 text-center text-[13px] font-bold text-[#2C3E50] transition-all hover:border-[#629584] hover:bg-[#E8F5F0] hover:text-[#629584]"
              >
                오픈소스-무료
              </button>
            </form>
            <hr className="mb-4 border-[#DFE1E6]" />
            <ul className="flex flex-col gap-2">
              <li className="flex items-start gap-[7px] text-xs text-[#2C3E50]">
                <span>✓</span> 칸반 보드 (Backlog ~ Done)
              </li>
              <li className="flex items-start gap-[7px] text-xs text-[#2C3E50]">
                <span>✓</span> Goal › Story › Feature › Task
              </li>
              <li className="flex items-start gap-[7px] text-xs text-[#2C3E50]">
                <span>✓</span> 체크리스트 · 라벨 · 우선순위
              </li>
              <li className="flex items-start gap-[7px] text-xs text-[#2C3E50]">
                <span>✓</span> 드래그 앤 드롭
              </li>
              <li className="flex items-start gap-[7px] text-xs text-[#2C3E50]">
                <span>✓</span> Google OAuth 로그인
              </li>
              <li className="flex items-start gap-[7px] text-xs text-[#2C3E50]">
                <span>✓</span> 댓글 &amp; 담당자
              </li>
            </ul>
          </div>

          {/* Workspace (Popular) */}
          <div className="flex flex-col rounded-[14px] border-[1.5px] border-[#629584] bg-white p-6 shadow-[0_4px_20px_rgba(98,149,132,.18)] transition-shadow hover:shadow-[0_8px_28px_rgba(0,0,0,.09)]">
            <span className="mb-3 inline-block self-start rounded-full bg-[#629584] px-2 py-[2px] text-[10px] font-bold text-white">
              Popular · 사용 가능
            </span>
            <div className="mb-1 text-[17px] font-extrabold text-[#2C3E50]">Workspace</div>
            <div className="mb-4 text-xs leading-relaxed text-[#5A6B7F]">
              스타트업 성장을 위한 협업과 진척 관리
            </div>
            <form
              action={async () => {
                'use server';
                await signIn('google', { redirectTo: '/' });
              }}
            >
              <button
                type="submit"
                className="mb-5 w-full cursor-pointer rounded-lg border-[1.5px] border-[#629584] bg-[#629584] px-2.5 py-2.5 text-center text-[13px] font-bold text-white transition-all hover:bg-[#4d7a6a]"
              >
                오픈소스-무료
              </button>
            </form>
            <hr className="mb-4 border-[#DFE1E6]" />
            <ul className="flex flex-col gap-2">
              <li className="flex items-start gap-[7px] text-xs text-[#2C3E50]">
                <span>✓</span> Personal 전체 포함
              </li>
              <li className="flex items-start gap-[7px] text-xs text-[#2C3E50]">
                <span>✓</span> 팀 워크스페이스 개설
              </li>
              <li className="flex items-start gap-[7px] text-xs text-[#2C3E50]">
                <span>✓</span> 멤버 초대 · 역할 관리
              </li>
              <li className="flex items-start gap-[7px] text-xs text-[#2C3E50]">
                <span>✓</span> WBS · 간트 차트
              </li>
              <li className="flex items-start gap-[7px] text-xs text-[#2C3E50]">
                <span>✓</span> 진척 대시보드
              </li>
              <li className="flex items-start gap-[7px] text-xs text-[#2C3E50]">
                <span>✓</span> 멤버별 진척 사항 및 통계
              </li>
              <li className="flex items-start gap-[7px] text-xs text-[#2C3E50]">
                <span>✓</span> 다중 담당자
              </li>
            </ul>
          </div>

          {/* Team Pro */}
          <div className="flex flex-col rounded-[14px] border-[1.5px] border-[#DFE1E6] bg-white p-6 transition-shadow hover:shadow-[0_8px_28px_rgba(0,0,0,.09)]">
            <span className="mb-3 inline-block self-start rounded-full bg-[#FEF3C7] px-2 py-[2px] text-[10px] font-bold text-[#92400E]">
              출시 준비중
            </span>
            <div className="mb-1 text-[17px] font-extrabold text-[#2C3E50]">Team Pro</div>
            <div className="mb-4 text-xs leading-relaxed text-[#5A6B7F]">
              MCP 연동과 알림으로 팀 업무 속도 향상
            </div>
            <NotifyModal
              type="team-pro"
              triggerLabel="출시 알림 받기"
              modalTitle="Team Pro 출시 알림 신청"
              modalDescription="출시 시 이메일로 가장 먼저 알려드립니다."
            />
            <hr className="mb-4 border-[#DFE1E6]" />
            <ul className="flex flex-col gap-2">
              <li className="flex items-start gap-[7px] text-xs text-[#2C3E50]">
                <span>✓</span> Workspace 전체 포함
              </li>
              <li className="flex items-start gap-[7px] text-xs text-[#2C3E50]">
                <span>✓</span> MCP 서버 연동
              </li>
              <li className="flex items-start gap-[7px] text-xs text-[#2C3E50]">
                <span>✓</span> 자동화 워크 플로우 지원
              </li>
              <li className="flex items-start gap-[7px] text-xs text-[#2C3E50]">
                <span>✓</span> 워크스페이스 생성 (최대 100개)
              </li>
              <li className="flex items-start gap-[7px] text-xs text-[#2C3E50]">
                <span>✓</span> Slack · Telegram 실시간 알림 설정
              </li>
              <li className="flex items-start gap-[7px] text-xs text-[#2C3E50]">
                <span>✓</span> Markdown 에디터 지원
              </li>
              <li className="flex items-start gap-[7px] text-xs text-[#2C3E50]">
                <span>✓</span> 이미지 및 파일 첨부
              </li>
              <li className="flex items-start gap-[7px] text-xs text-[#2C3E50]">
                <span>✓</span> 번다운 · 워크로드 · 통계 팀 대시보드
              </li>
            </ul>
          </div>

          {/* Enterprise */}
          <div className="flex flex-col rounded-[14px] border-[1.5px] border-[#DFE1E6] bg-white p-6 transition-shadow hover:shadow-[0_8px_28px_rgba(0,0,0,.09)]">
            <span className="mb-3 inline-block self-start rounded-full bg-[#FEE2E2] px-2 py-[2px] text-[10px] font-bold text-[#DC2626]">
              문의
            </span>
            <div className="mb-1 text-[17px] font-extrabold text-[#2C3E50]">Enterprise</div>
            <div className="mb-4 text-xs leading-relaxed text-[#5A6B7F]">
              온프레미스 설치 &amp; 커스터마이징 지원
            </div>
            <ContactModal defaultSubject="enterprise" />
            <hr className="mb-4 border-[#DFE1E6]" />
            <ul className="flex flex-col gap-2">
              <li className="flex items-start gap-[7px] text-xs text-[#2C3E50]">
                <span>✓</span> Team Pro 전체 포함
              </li>
              <li className="flex items-start gap-[7px] text-xs text-[#2C3E50]">
                <span>✓</span> 셀프 호스팅 (온프레미스)
              </li>
              <li className="flex items-start gap-[7px] text-xs text-[#2C3E50]">
                <span>✓</span> 커스텀 워크플로우 지원
              </li>
              <li className="flex items-start gap-[7px] text-xs text-[#2C3E50]">
                <span>✓</span> AI 도구 연동 지원 (API Key 연동)
              </li>
              <li className="flex items-start gap-[7px] text-xs text-[#2C3E50]">
                <span>✓</span> REST API &amp; 웹훅
              </li>
              <li className="flex items-start gap-[7px] text-xs text-[#2C3E50]">
                <span>✓</span> 고급 검색 &amp; 퀵 필터
              </li>
              <li className="flex items-start gap-[7px] text-xs text-[#2C3E50]">
                <span>✓</span> 무제한 첨부 파일
              </li>
              <li className="flex items-start gap-[7px] text-xs text-[#2C3E50]">
                <span>✓</span> 워크스페이스 제한 없음
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="mx-auto max-w-[900px] px-6">
        <hr className="border-[#DFE1E6]" />
      </div>

      {/* FAQ */}
      <section className="mx-auto max-w-[900px] px-6 pt-[72px] pb-10 text-center">
        <span className="mb-3.5 inline-block rounded-full bg-[#E8F5F0] px-2.5 py-[3px] text-[11px] font-bold tracking-[.08em] text-[#629584] uppercase">
          자주 묻는 질문
        </span>
        <h2 className="mb-2.5 text-[28px] font-extrabold text-[#2C3E50]">
          궁금한 점이 있으신가요?
        </h2>
        <FaqSection />
      </section>


      {/* Footer */}
      <footer className="mt-[72px] border-t border-[#DFE1E6] px-6 py-8 text-center text-xs text-[#8993A4]">
        <div className="mb-3 flex flex-wrap justify-center gap-5">
          <span className="text-[#5A6B7F] hover:text-[#629584]">개인정보처리방침</span>
          <span className="text-[#5A6B7F] hover:text-[#629584]">이용약관</span>
          <a href="https://t.me/tikawebsite" target="_blank" rel="noopener noreferrer" className="text-[#5A6B7F] hover:text-[#629584]">
            텔레그램으로 문의하기
          </a>
        </div>
        Tika &mdash; Plan Simply. Ship Boldly. &copy; 2026
      </footer>
    </div>
  );
}
