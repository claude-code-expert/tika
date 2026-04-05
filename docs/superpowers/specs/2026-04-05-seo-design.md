# SEO 최적화 설계 — Tika

> 작성일: 2026-04-05 | 도메인: https://tika.vercel.app | 접근 방식: 점진적 레이어 적용 (A)

---

## 배경 및 목표

Tika는 Next.js 15 App Router 기반 SaaS 칸반 보드 앱으로, 현재 글로벌 메타데이터에 `metadataBase` 누락, OG 이미지 없음, JSON-LD 없음 등 SEO 기초 요소가 미완성 상태다. 본 설계는 SEO_GUIDE.md 기준을 충족하며 공개 페이지의 검색 노출 품질과 SNS 공유 미리보기를 개선한다.

**범위:** 전체 페이지 (공개 + 인증 필요 앱 페이지)  
**JSON-LD:** `layout.tsx` (WebApplication + Organization) + `login/page.tsx` (FAQPage)  
**OG 이미지:** `/images/tika-hero.png` (1376×768, 기존 에셋 활용)

---

## 섹션 1 — 글로벌 기반 (`app/layout.tsx`)

### 문제점
- `metadataBase` 없음 → 상대 경로 OG 이미지 URL이 크롤러에 잘못 전달됨
- `og:image`, `twitter:image` 없음
- Twitter card가 `summary` (이미지 없는 작은 카드)
- JSON-LD 없음

### 변경 사항

**메타데이터:**
```typescript
metadataBase: new URL('https://tika.vercel.app'),
description: '티켓 기반 칸반 보드로 목표를 분해하고 팀과 함께 실행하세요. 개인 플랜 영구 무료.',
openGraph: {
  title: 'Tika',
  description: '티켓 기반 칸반 보드로 목표를 분해하고 팀과 함께 실행하세요.',
  siteName: 'Tika',
  locale: 'ko_KR',
  type: 'website',
  images: [{ url: '/images/tika-hero.png', width: 1376, height: 768, alt: 'Tika 칸반 보드 — Plan Simply. Ship Boldly.' }],
},
twitter: {
  card: 'summary_large_image',
  title: 'Tika',
  description: '티켓 기반 칸반 보드로 목표를 분해하고 팀과 함께 실행하세요.',
  images: ['/images/tika-hero.png'],
},
```

**JSON-LD (`<body>` 최상단 `<script type="application/ld+json">`):**
```json
[
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Tika",
    "url": "https://tika.vercel.app",
    "description": "티켓 기반 칸반 보드 프로젝트 관리 앱",
    "applicationCategory": "ProductivityApplication",
    "operatingSystem": "Web",
    "inLanguage": "ko-KR",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "KRW" }
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Tika",
    "url": "https://tika.vercel.app",
    "logo": {
      "@type": "ImageObject",
      "url": "https://tika.vercel.app/images/icon/favicon-32.png"
    }
  }
]
```

---

## 섹션 2 — 랜딩 페이지 (`app/login/page.tsx`)

가장 중요한 공개 페이지. 크롤러가 실질적으로 인덱싱하는 유일한 콘텐츠 페이지.

### 변경 사항

**메타데이터:**
```typescript
title: { absolute: 'Tika — 칸반 보드 프로젝트 관리 앱' },  // 키워드 전진 배치, 템플릿 오버라이드
description: '티켓 기반 칸반 보드로 목표를 분해하고 팀과 함께 실행하세요. 개인 플랜 영구 무료 — 지금 시작하세요.',
alternates: { canonical: 'https://tika.vercel.app/login' },
openGraph: {
  title: 'Tika — 칸반 보드 프로젝트 관리 앱',
  description: '티켓 기반 칸반 보드로 목표를 분해하고 팀과 함께 실행하세요. 개인 플랜 영구 무료.',
  type: 'website',
  images: [{ url: '/images/tika-hero.png', width: 1376, height: 768, alt: 'Tika 칸반 보드' }],
},
twitter: { card: 'summary_large_image', ... },
```

**JSON-LD — FAQPage (faq.json 6개 항목 인라인):**

FAQSection 컴포넌트는 클라이언트에서 동적 fetch로 FAQ를 로드하므로 크롤러가 읽지 못한다. 서버 렌더링 시점에 JSON-LD로 동일 데이터를 인라인 삽입하여 검색 결과에 FAQ 리치 스니펫을 노출한다.

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "무료로 계속 쓸 수 있나요?",
      "acceptedAnswer": { "@type": "Answer", "text": "Personal 플랜은 영구 무료..." }
    },
    ... (6개 전부)
  ]
}
```

---

## 섹션 3 — 개별 페이지 메타데이터 정리

| 파일 | 변경 내용 |
|------|-----------|
| `app/page.tsx` | title "로그인" → `{ absolute: 'Tika' }` (리다이렉트 페이지, 최소화) |
| `app/invite/[token]/page.tsx` | description 구체화 + og:image 추가 |
| `app/onboarding/page.tsx` | title "온보딩" → "시작하기", description 개선 |
| `app/onboarding/workspace/page.tsx` | Metadata 선언 추가 |
| `app/notifications/page.tsx` | `Metadata` 타입 명시 추가 |
| `app/settings/page.tsx` | description 개선 |
| `app/workspace/[id]/page.tsx` | description 개선 |
| `app/workspace/[id]/board/page.tsx` | description 개선 |
| `app/workspace/[id]/members/page.tsx` | description 개선 |
| `app/workspace/[id]/analytics/page.tsx` | description 개선 |
| `app/workspace/[id]/wbs/page.tsx` | description 개선 |
| `app/workspace/[id]/burndown/page.tsx` | description 개선 |
| `app/workspace/[id]/trash/page.tsx` | description 개선 |
| `app/workspace/[id]/[ticketId]/page.tsx` | Metadata 선언 추가 |

---

## 섹션 4 — `app/sitemap.ts`

공개 크롤링 대상은 `/login`과 `/` 두 페이지뿐. 인증 필요 페이지는 `robots.ts`에서 이미 disallow 처리됨.

```typescript
[
  { url: 'https://tika.vercel.app/login', priority: 1, changeFrequency: 'monthly' },
  { url: 'https://tika.vercel.app', priority: 0.5, changeFrequency: 'yearly' },
]
```

## `app/robots.ts`

현재 설정 적절 — 변경 없음.

---

## 구현 요약

| 항목 | 파일 수 |
|------|---------|
| 수정 파일 | 17개 (layout + login + sitemap + 페이지 14개) |
| 신규 파일 | 없음 |
| JSON-LD 삽입 | 2곳 (layout, login) |
| OG 이미지 | 기존 `/images/tika-hero.png` 활용 |

## 준수 기준 (SEO_GUIDE.md)

- [x] 동적 Head 제어 — Metadata API 사용
- [x] og:title, og:description, og:image 필수 설정
- [x] Twitter Card summary_large_image
- [x] metadataBase로 canonical URL 기반 확립
- [x] sitemap.xml 우선순위 정비
- [x] robots.txt 인증 페이지 disallow 유지
- [x] JSON-LD 구조화 데이터 (WebApplication, Organization, FAQPage)
