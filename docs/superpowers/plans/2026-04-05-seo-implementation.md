# SEO 최적화 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tika 전체 페이지에 Next.js Metadata API 기반 SEO 최적화를 적용하고 JSON-LD 구조화 데이터를 삽입한다.

**Architecture:** 점진적 레이어 구조 — `layout.tsx`에서 글로벌 기본값(metadataBase, OG 이미지, JSON-LD)을 확립하고, 각 `page.tsx`에서 `export const metadata`로 오버라이드한다. JSON-LD는 `login/page.tsx`(FAQPage)와 `layout.tsx`(WebApplication+Organization) 두 곳에만 삽입한다.

**Tech Stack:** Next.js 15 Metadata API, Schema.org JSON-LD, TypeScript

---

## 파일 맵

| 파일 | 변경 유형 |
|------|-----------|
| `app/layout.tsx` | metadataBase 추가, OG 이미지, Twitter 업그레이드, JSON-LD 삽입 |
| `app/login/page.tsx` | 메타데이터 전면 개선, FAQPage JSON-LD 삽입 |
| `app/page.tsx` | 잘못된 title "로그인" 수정 |
| `app/sitemap.ts` | 우선순위 재조정 |
| `app/invite/[token]/page.tsx` | description 구체화, OG 이미지 추가 |
| `app/onboarding/page.tsx` | title 수정, description 개선 |
| `app/onboarding/workspace/page.tsx` | Metadata 선언 신규 추가 |
| `app/notifications/page.tsx` | Metadata 타입 명시 |
| `app/settings/page.tsx` | description 개선 |
| `app/workspace/[workspaceId]/page.tsx` | description 개선 |
| `app/workspace/[workspaceId]/board/page.tsx` | description 개선 |
| `app/workspace/[workspaceId]/members/page.tsx` | description 개선 |
| `app/workspace/[workspaceId]/analytics/page.tsx` | description 개선 |
| `app/workspace/[workspaceId]/wbs/page.tsx` | description 개선 |
| `app/workspace/[workspaceId]/burndown/page.tsx` | description 개선 |
| `app/workspace/[workspaceId]/trash/page.tsx` | description 개선 |
| `app/workspace/[workspaceId]/[ticketId]/page.tsx` | description 개선 |

---

## Task 1: 글로벌 기반 — `app/layout.tsx`

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: `app/layout.tsx` 메타데이터 및 JSON-LD 적용**

`app/layout.tsx`의 `metadata` export와 `RootLayout` 함수를 아래로 교체한다.

```typescript
import type { Metadata } from 'next';
import Script from "next/script";
import { SessionProvider } from 'next-auth/react';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://tika.vercel.app'),
  title: { default: 'Tika', template: '%s | Tika' },
  description: '티켓 기반 칸반 보드로 목표를 분해하고 팀과 함께 실행하세요. 개인 플랜 영구 무료.',
  icons: {
    icon: [
      { url: '/images/icon/favicon.ico', sizes: 'any' },
      { url: '/images/icon/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/images/icon/favicon-32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/images/icon/apple-touch-icon.png',
  },
  openGraph: {
    title: 'Tika',
    description: '티켓 기반 칸반 보드로 목표를 분해하고 팀과 함께 실행하세요.',
    siteName: 'Tika',
    locale: 'ko_KR',
    type: 'website',
    images: [
      {
        url: '/images/tika-hero.png',
        width: 1376,
        height: 768,
        alt: 'Tika 칸반 보드 — Plan Simply. Ship Boldly.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tika',
    description: '티켓 기반 칸반 보드로 목표를 분해하고 팀과 함께 실행하세요.',
    images: ['/images/tika-hero.png'],
  },
};

const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Tika',
    url: 'https://tika.vercel.app',
    description: '티켓 기반 칸반 보드 프로젝트 관리 앱',
    applicationCategory: 'ProductivityApplication',
    operatingSystem: 'Web',
    inLanguage: 'ko-KR',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'KRW' },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Tika',
    url: 'https://tika.vercel.app',
    logo: {
      '@type': 'ImageObject',
      url: 'https://tika.vercel.app/images/icon/favicon-32.png',
    },
  },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        {process.env.NODE_ENV === "development" && (
          <Script
            src="//unpkg.com/react-grab/dist/index.global.js"
            crossOrigin="anonymous"
            strategy="beforeInteractive"
          />
        )}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: 빌드 타입 오류 확인**

```bash
npx tsc --noEmit
```

오류 없으면 통과.

- [ ] **Step 3: 커밋**

```bash
git add app/layout.tsx
git commit -m "seo: add metadataBase, og:image, twitter card upgrade, JSON-LD to layout"
```

---

## Task 2: 랜딩 페이지 — `app/login/page.tsx`

**Files:**
- Modify: `app/login/page.tsx:1-11`

- [ ] **Step 1: 메타데이터 블록 교체 및 FAQPage JSON-LD 추가**

`app/login/page.tsx` 상단의 `import type { Metadata } from 'next';`와 `export const metadata` 블록을 아래로 교체한다. 그리고 `export default async function LoginPage(` 직전에 `faqJsonLd` 상수를 추가한다.

파일 상단 (기존 `import type { Metadata } from 'next';` ~ `};` 까지):
```typescript
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: 'Tika — 칸반 보드 프로젝트 관리 앱' },
  description:
    '티켓 기반 칸반 보드로 목표를 분해하고 팀과 함께 실행하세요. 개인 플랜 영구 무료 — 지금 시작하세요.',
  alternates: {
    canonical: 'https://tika.vercel.app/login',
  },
  openGraph: {
    title: 'Tika — 칸반 보드 프로젝트 관리 앱',
    description:
      '티켓 기반 칸반 보드로 목표를 분해하고 팀과 함께 실행하세요. 개인 플랜 영구 무료.',
    type: 'website',
    images: [
      {
        url: '/images/tika-hero.png',
        width: 1376,
        height: 768,
        alt: 'Tika 칸반 보드 — Plan Simply. Ship Boldly.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tika — 칸반 보드 프로젝트 관리 앱',
    description: '티켓 기반 칸반 보드로 목표를 분해하고 팀과 함께 실행하세요.',
    images: ['/images/tika-hero.png'],
  },
};
```

`export default async function LoginPage(` 바로 위에 추가:
```typescript
const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: '무료로 계속 쓸 수 있나요?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Personal 플랜은 영구 무료이며 개인 할 일 관리에 필요한 핵심 기능을 모두 제공합니다. Workspace 플랜도 계정당 워크스페이스 3건은 무료로 이용하실 수 있습니다.(총 티켓수 제한 1000개)',
      },
    },
    {
      '@type': 'Question',
      name: '개인 정보는 어떻게 관리 되나요?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Tika는 구글 OAuth 로그인 이외에 별도의 개인정보를 저장하지 않습니다. 로그인 시 유니크한 값으로 치환하여 관리하고 있으므로 유출의 위험에서 안전합니다.',
      },
    },
    {
      '@type': 'Question',
      name: '팀원을 몇 명까지 초대할 수 있나요?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: '현재 Workspace 플랜에서는 워크스페이스당 팀원 초대에 별도 제한이 없습니다. Team Pro 출시 이후 플랜별 정책이 확정될 예정입니다.',
      },
    },
    {
      '@type': 'Question',
      name: 'MCP는 어떤 AI와 연동되나요?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Team Pro 플랜에서 Tika MCP 서버(@tika/mcp-server)를 제공합니다. Claude Code, Cursor 등 MCP를 지원하는 AI 개발 도구에서 PAT 인증으로 연결하면, 개발 툴에서 Tika 티켓을 직접 조회·생성·수정·삭제 등 티켓 관리를 할 수 있습니다.',
      },
    },
    {
      '@type': 'Question',
      name: '데이터는 어디에 저장되나요?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: '클라우드 플랜은 Vercel + Neon(PostgreSQL) 인프라에 안전하게 저장됩니다. Enterprise 버전은 온프레미스 설치용으로 고객사 서버에만 데이터가 저장되며 외부 전송이 없습니다.',
      },
    },
    {
      '@type': 'Question',
      name: 'Enterprise 도입 절차는 어떻게 되나요?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: '도입 문의하기 버튼이나 brewnet.dev@gmail.com으로 문의 주시면 영업일 1일 이내 담당자가 연락드립니다. 요구사항 파악 → 데모 → 계약 → 설치 지원 순서로 진행됩니다.',
      },
    },
  ],
};
```

- [ ] **Step 2: JSON-LD `<script>` 태그를 LoginPage return 최상단에 삽입**

`LoginPage`의 return 문 안, 최상단 `<div>` 바로 안쪽에 추가:
```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
/>
```

전체 return 구조:
```tsx
return (
  <div className="min-h-screen bg-[#F8F9FB]" style={{ ... }}>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
    />
    {/* Hero */}
    <section ...>
    ...
```

- [ ] **Step 3: 타입 오류 확인**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: 커밋**

```bash
git add app/login/page.tsx
git commit -m "seo: improve landing page metadata and add FAQPage JSON-LD"
```

---

## Task 3: 홈 리다이렉트 및 Sitemap 수정

**Files:**
- Modify: `app/page.tsx:9-12`
- Modify: `app/sitemap.ts`

- [ ] **Step 1: `app/page.tsx` title 수정**

기존:
```typescript
export const metadata: Metadata = {
  title: '로그인',
  description: '티카에 로그인하여 칸반 보드로 업무를 관리하세요.',
};
```

변경:
```typescript
export const metadata: Metadata = {
  title: { absolute: 'Tika' },
  description: '칸반 보드로 업무를 체계적으로 관리하세요.',
};
```

- [ ] **Step 2: `app/sitemap.ts` 우선순위 재조정**

기존:
```typescript
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://tika.vercel.app',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: 'https://tika.vercel.app/login',
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.8,
    },
  ];
}
```

변경:
```typescript
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://tika.vercel.app/login',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: 'https://tika.vercel.app',
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
  ];
}
```

- [ ] **Step 3: 커밋**

```bash
git add app/page.tsx app/sitemap.ts
git commit -m "seo: fix home page title and update sitemap priorities"
```

---

## Task 4: 공개 진입 페이지 — Invite / Onboarding

**Files:**
- Modify: `app/invite/[token]/page.tsx:7-10`
- Modify: `app/onboarding/page.tsx:9-12`
- Modify: `app/onboarding/workspace/page.tsx` (Metadata 신규 추가)

- [ ] **Step 1: `app/invite/[token]/page.tsx` 메타데이터 개선**

기존:
```typescript
export const metadata: Metadata = {
  title: '초대 수락',
  description: '팀 워크스페이스 초대를 수락하세요.',
};
```

변경:
```typescript
export const metadata: Metadata = {
  title: '팀 초대',
  description: 'Tika 팀 워크스페이스에 초대받았습니다. 수락하고 바로 협업을 시작하세요.',
  openGraph: {
    images: [{ url: '/images/tika-hero.png', width: 1376, height: 768, alt: 'Tika 팀 초대' }],
  },
};
```

- [ ] **Step 2: `app/onboarding/page.tsx` 메타데이터 수정**

기존:
```typescript
export const metadata: Metadata = {
  title: '온보딩',
  description: '워크스페이스 설정을 시작하세요.',
};
```

변경:
```typescript
export const metadata: Metadata = {
  title: '시작하기',
  description: 'Tika 워크스페이스를 설정하고 칸반 보드로 업무 관리를 시작하세요.',
};
```

- [ ] **Step 3: `app/onboarding/workspace/page.tsx` Metadata 추가**

파일 상단 import 목록 뒤에 추가 (기존 `import { redirect }` 등 import 바로 아래):
```typescript
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '워크스페이스 만들기',
  description: '새 워크스페이스를 만들고 팀원을 초대해 협업을 시작하세요.',
};
```

- [ ] **Step 4: 커밋**

```bash
git add app/invite/\[token\]/page.tsx app/onboarding/page.tsx app/onboarding/workspace/page.tsx
git commit -m "seo: improve invite and onboarding page metadata"
```

---

## Task 5: 앱 내 페이지 메타데이터 일괄 개선

**Files:**
- Modify: `app/notifications/page.tsx`
- Modify: `app/settings/page.tsx`
- Modify: `app/workspace/[workspaceId]/page.tsx:18-21`
- Modify: `app/workspace/[workspaceId]/board/page.tsx`
- Modify: `app/workspace/[workspaceId]/members/page.tsx`
- Modify: `app/workspace/[workspaceId]/analytics/page.tsx`
- Modify: `app/workspace/[workspaceId]/wbs/page.tsx`
- Modify: `app/workspace/[workspaceId]/burndown/page.tsx`
- Modify: `app/workspace/[workspaceId]/trash/page.tsx`
- Modify: `app/workspace/[workspaceId]/[ticketId]/page.tsx`

- [ ] **Step 1: `app/notifications/page.tsx` — Metadata 타입 명시**

기존:
```typescript
export const metadata = {
  title: '알림 내역 | Tika',
};
```

변경 (layout의 template `'%s | Tika'`가 자동 적용되므로 중복 제거):
```typescript
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '알림',
  description: '받은 알림을 확인하고 워크스페이스 활동을 파악하세요.',
};
```

- [ ] **Step 2: `app/settings/page.tsx` — description 개선**

기존:
```typescript
export const metadata: Metadata = {
  title: '설정',
  description: '프로필 및 워크스페이스 설정을 관리하세요.',
};
```

변경:
```typescript
export const metadata: Metadata = {
  title: '설정',
  description: '계정 프로필, 워크스페이스, 알림 설정을 한 곳에서 관리하세요.',
};
```

- [ ] **Step 3: `app/workspace/[workspaceId]/page.tsx` — description 개선**

기존:
```typescript
export const metadata: Metadata = {
  title: '대시보드',
  description: '팀 워크스페이스 대시보드입니다.',
};
```

변경:
```typescript
export const metadata: Metadata = {
  title: '대시보드',
  description: '팀 진행 현황, 목표 달성률, 멤버 워크로드를 한눈에 파악하세요.',
};
```

- [ ] **Step 4: `app/workspace/[workspaceId]/board/page.tsx` — description 개선**

기존:
```typescript
export const metadata: Metadata = {
  title: '칸반 보드',
  description: '칸반 보드에서 티켓을 관리하세요.',
};
```

변경:
```typescript
export const metadata: Metadata = {
  title: '칸반 보드',
  description: 'BACKLOG · TODO · IN PROGRESS · DONE 4단계 칸반 보드에서 티켓을 드래그 앤 드롭으로 관리하세요.',
};
```

- [ ] **Step 5: `app/workspace/[workspaceId]/members/page.tsx` — description 개선**

기존:
```typescript
export const metadata: Metadata = {
  title: '멤버 관리',
  description: '워크스페이스 멤버를 관리하세요.',
};
```

변경:
```typescript
export const metadata: Metadata = {
  title: '멤버 관리',
  description: '워크스페이스 멤버를 초대·관리하고 역할 및 권한을 설정하세요.',
};
```

- [ ] **Step 6: `app/workspace/[workspaceId]/analytics/page.tsx` — description 개선**

기존:
```typescript
export const metadata: Metadata = {
  title: '분석',
  description: '팀 업무 현황을 분석하세요.',
};
```

변경:
```typescript
export const metadata: Metadata = {
  title: '분석',
  description: '속도 지표, CFD, 사이클 타임 등 팀 업무 데이터를 분석해 생산성을 개선하세요.',
};
```

- [ ] **Step 7: `app/workspace/[workspaceId]/wbs/page.tsx` — description 개선**

기존:
```typescript
export const metadata: Metadata = {
  title: 'WBS',
  description: 'WBS와 간트 차트로 업무 계획을 시각화하세요.',
};
```

변경:
```typescript
export const metadata: Metadata = {
  title: 'WBS',
  description: 'Goal→Story→Feature→Task 계층 구조로 업무를 분해하고 간트 차트로 일정을 시각화하세요.',
};
```

- [ ] **Step 8: `app/workspace/[workspaceId]/burndown/page.tsx` — description 개선**

기존:
```typescript
export const metadata: Metadata = {
  title: '번다운 차트',
  description: '스프린트 번다운 차트를 확인하세요.',
};
```

변경:
```typescript
export const metadata: Metadata = {
  title: '번다운 차트',
  description: '스프린트 번다운 차트로 남은 작업량과 팀 속도를 추적하세요.',
};
```

- [ ] **Step 9: `app/workspace/[workspaceId]/trash/page.tsx` — description 개선**

기존:
```typescript
export const metadata: Metadata = {
  title: '휴지통',
  description: '삭제된 티켓을 복원하거나 영구 삭제하세요.',
};
```

변경:
```typescript
export const metadata: Metadata = {
  title: '휴지통',
  description: '삭제된 티켓을 30일 이내 복원하거나 영구 삭제하세요.',
};
```

- [ ] **Step 10: `app/workspace/[workspaceId]/[ticketId]/page.tsx` — description 개선**

기존:
```typescript
export const metadata: Metadata = {
  title: '티켓 상세',
  description: '티켓 상세 정보를 확인하세요.',
};
```

변경:
```typescript
export const metadata: Metadata = {
  title: '티켓 상세',
  description: '티켓 설명, 우선순위, 담당자, 체크리스트, 댓글을 확인하고 관리하세요.',
};
```

- [ ] **Step 11: 커밋**

```bash
git add \
  app/notifications/page.tsx \
  app/settings/page.tsx \
  "app/workspace/[workspaceId]/page.tsx" \
  "app/workspace/[workspaceId]/board/page.tsx" \
  "app/workspace/[workspaceId]/members/page.tsx" \
  "app/workspace/[workspaceId]/analytics/page.tsx" \
  "app/workspace/[workspaceId]/wbs/page.tsx" \
  "app/workspace/[workspaceId]/burndown/page.tsx" \
  "app/workspace/[workspaceId]/trash/page.tsx" \
  "app/workspace/[workspaceId]/[ticketId]/page.tsx"
git commit -m "seo: improve description metadata for all app pages"
```

---

## Task 6: 최종 빌드 검증

- [ ] **Step 1: TypeScript 전체 검사**

```bash
npx tsc --noEmit
```

오류 0개 확인.

- [ ] **Step 2: 프로덕션 빌드**

```bash
npm run build
```

빌드 성공 확인. `Route (app)` 목록에서 각 페이지 메타데이터 경고 없음 확인.

- [ ] **Step 3: Sitemap 확인 (개발 서버)**

```bash
npm run dev
```

브라우저에서 `http://localhost:3000/sitemap.xml` 접근 → `/login` 이 priority 1로 최상단에 있는지 확인.

- [ ] **Step 4: 최종 커밋**

빌드 결과물(`.next/`)은 커밋하지 않음. 소스 파일만 확인 후 이미 커밋되었으면 완료.

```bash
git log --oneline -6
```

예상 출력:
```
seo: improve description metadata for all app pages
seo: improve invite and onboarding page metadata
seo: fix home page title and update sitemap priorities
seo: improve landing page metadata and add FAQPage JSON-LD
seo: add metadataBase, og:image, twitter card upgrade, JSON-LD to layout
docs: add SEO optimization design spec
```
