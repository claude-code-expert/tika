import { config } from 'dotenv';
config({ path: '.env.local' });

import { drizzle } from 'drizzle-orm/vercel-postgres';
import { tickets } from './schema';
import { POSITION_GAP } from '@/lib/constants';

async function seed() {
  const db = drizzle();

  console.log('🌱 Seeding database...');

  // 기존 데이터 삭제
  await db.delete(tickets);

  // 시드 데이터 삽입
  const seedData = [
    {
      title: '프로젝트 요구사항 정리',
      description: 'PRD 문서를 작성하고 팀과 리뷰한다',
      status: 'DONE' as const,
      priority: 'HIGH' as const,
      position: 0,
      completedAt: new Date('2026-01-28'),
    },
    {
      title: 'UI 와이어프레임 작성',
      description: 'Figma로 주요 화면 와이어프레임을 그린다',
      status: 'DONE' as const,
      priority: 'MEDIUM' as const,
      position: POSITION_GAP,
      completedAt: new Date('2026-01-30'),
    },
    {
      title: 'API 설계 문서 작성',
      description: 'REST API 엔드포인트를 정의하고 명세서를 작성한다',
      status: 'IN_PROGRESS' as const,
      priority: 'HIGH' as const,
      position: 0,
    },
    {
      title: 'DB 스키마 설계',
      description: 'Drizzle ORM 스키마를 정의한다',
      status: 'IN_PROGRESS' as const,
      priority: 'MEDIUM' as const,
      position: POSITION_GAP,
    },
    {
      title: '칸반 보드 UI 구현',
      description: '드래그앤드롭이 되는 칸반 보드 컴포넌트를 만든다',
      status: 'TODO' as const,
      priority: 'HIGH' as const,
      position: 0,
      dueDate: '2026-02-10',
    },
    {
      title: '대시보드 레이아웃',
      description: '반응형 레이아웃을 적용한다',
      status: 'TODO' as const,
      priority: 'MEDIUM' as const,
      position: POSITION_GAP,
      dueDate: '2026-02-12',
    },
    {
      title: '알림 기능 조사',
      description: null,
      status: 'BACKLOG' as const,
      priority: 'LOW' as const,
      position: 0,
    },
    {
      title: '성능 테스트 계획',
      description: 'Lighthouse 기준 90점 이상 달성 계획 수립',
      status: 'BACKLOG' as const,
      priority: 'MEDIUM' as const,
      position: POSITION_GAP,
    },
    {
      title: 'CI/CD 파이프라인 구축',
      description: 'GitHub Actions + Vercel 자동 배포',
      status: 'BACKLOG' as const,
      priority: 'LOW' as const,
      position: POSITION_GAP * 2,
      dueDate: '2026-01-25', // 의도적 오버듀 데이터
    },
  ];

  await db.insert(tickets).values(seedData);

  console.log(`✅ Seeded ${seedData.length} tickets`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
