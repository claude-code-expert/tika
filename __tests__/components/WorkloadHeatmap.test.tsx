/**
 * WorkloadHeatmap 컴포넌트 테스트
 *
 * 대상: src/components/team/WorkloadHeatmap.tsx
 *
 * 커버리지:
 *   1. 빈 멤버 목록 → 빈 상태 텍스트
 *   2. 멤버 이름 및 아바타 렌더링
 *   3. 역할 배지 표시 (Owner / Member / Viewer)
 *   4. 워크로드 라벨 (과중 / 보통 / 적정 / 여유)
 *   5. 소화율(%) 수치 표시
 *   6. 일정초과 카운트 표시
 *   7. Workday = assigned * 2
 *   8. compact=true 시 일부 컬럼 미표시
 */

import { render, screen } from '@testing-library/react';
import { WorkloadHeatmap } from '@/components/team/WorkloadHeatmap';
import type { MemberWorkload } from '@/types/index';

// ── 픽스쳐 팩토리 ─────────────────────────────────────────────────────────

function makeMember(overrides: Partial<MemberWorkload> = {}): MemberWorkload {
  return {
    memberId: 1,
    displayName: '홍길동',
    email: 'test@example.com',
    color: '#629584',
    role: 'MEMBER',
    assigned: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0,
    byStatus: { BACKLOG: 0, TODO: 0, IN_PROGRESS: 0, DONE: 0 },
    ...overrides,
  };
}

// ── 테스트 ────────────────────────────────────────────────────────────────

describe('WorkloadHeatmap', () => {
  describe('빈 상태', () => {
    it('members=[] 이면 "멤버 없음" 텍스트가 표시된다', () => {
      render(<WorkloadHeatmap members={[]} />);
      expect(screen.getByText('멤버 없음')).toBeInTheDocument();
    });

    it('members=[] 이면 table이 렌더링되지 않는다', () => {
      render(<WorkloadHeatmap members={[]} />);
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });
  });

  describe('멤버 행 렌더링', () => {
    it('멤버 이름이 표시된다', () => {
      render(<WorkloadHeatmap members={[makeMember({ displayName: '박지현' })]} />);
      expect(screen.getByText('박지현')).toBeInTheDocument();
    });

    it('아바타에 이름 첫 글자(대문자)가 표시된다', () => {
      render(<WorkloadHeatmap members={[makeMember({ displayName: 'alice' })]} />);
      expect(screen.getByText('A')).toBeInTheDocument();
    });

    it('여러 멤버가 모두 렌더링된다', () => {
      const members = [
        makeMember({ memberId: 1, displayName: '이순신' }),
        makeMember({ memberId: 2, displayName: '강감찬' }),
        makeMember({ memberId: 3, displayName: '세종대왕' }),
      ];
      render(<WorkloadHeatmap members={members} />);
      expect(screen.getByText('이순신')).toBeInTheDocument();
      expect(screen.getByText('강감찬')).toBeInTheDocument();
      expect(screen.getByText('세종대왕')).toBeInTheDocument();
    });
  });

  describe('역할 배지', () => {
    it('OWNER 역할은 "Owner" 배지가 표시된다', () => {
      render(<WorkloadHeatmap members={[makeMember({ role: 'OWNER' })]} />);
      expect(screen.getByText('Owner')).toBeInTheDocument();
    });

    it('MEMBER 역할은 "Member" 배지가 표시된다', () => {
      render(<WorkloadHeatmap members={[makeMember({ role: 'MEMBER' })]} />);
      expect(screen.getByText('Member')).toBeInTheDocument();
    });

    it('VIEWER 역할은 "Viewer" 배지가 표시된다', () => {
      render(<WorkloadHeatmap members={[makeMember({ role: 'VIEWER' })]} />);
      expect(screen.getByText('Viewer')).toBeInTheDocument();
    });
  });

  describe('워크로드 라벨', () => {
    it('assigned=0 → "여유"', () => {
      render(<WorkloadHeatmap members={[makeMember({ assigned: 0, completed: 0 })]} />);
      expect(screen.getByText('여유')).toBeInTheDocument();
    });

    it('완료율 >= 80% → "과중"', () => {
      render(<WorkloadHeatmap members={[makeMember({ assigned: 10, completed: 8 })]} />);
      expect(screen.getByText('과중')).toBeInTheDocument();
    });

    it('완료율 >= 60% → "보통"', () => {
      render(<WorkloadHeatmap members={[makeMember({ assigned: 10, completed: 6 })]} />);
      expect(screen.getByText('보통')).toBeInTheDocument();
    });

    it('완료율 < 60% → "적정"', () => {
      render(<WorkloadHeatmap members={[makeMember({ assigned: 10, completed: 3 })]} />);
      expect(screen.getByText('적정')).toBeInTheDocument();
    });
  });

  describe('소화율(%) 수치', () => {
    it('할당=10, 완료=5 → "50%"가 표시된다', () => {
      render(<WorkloadHeatmap members={[makeMember({ assigned: 10, completed: 5 })]} />);
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('할당=0 → "0%"가 표시된다', () => {
      render(<WorkloadHeatmap members={[makeMember({ assigned: 0, completed: 0 })]} />);
      expect(screen.getByText('0%')).toBeInTheDocument();
    });
  });

  describe('일정초과 카운트', () => {
    it('overdue=0이면 "0"이 표시된다', () => {
      const { container } = render(<WorkloadHeatmap members={[makeMember({ overdue: 0 })]} />);
      // overdue 컬럼의 td가 "0" 텍스트를 포함
      const tds = container.querySelectorAll('td');
      const overdueTd = Array.from(tds).find((td) => td.textContent === '0' && td.style.color === 'rgb(209, 213, 219)');
      expect(overdueTd).toBeTruthy();
    });

    it('overdue > 0이면 해당 숫자가 빨간색으로 표시된다', () => {
      const { container } = render(<WorkloadHeatmap members={[makeMember({ overdue: 3 })]} />);
      const overdueTd = Array.from(container.querySelectorAll('td')).find(
        (td) => td.textContent === '3' && td.style.color === 'rgb(220, 38, 38)',
      );
      expect(overdueTd).toBeTruthy();
    });
  });

  describe('Workday', () => {
    it('assigned=7 → "14d"가 표시된다', () => {
      render(<WorkloadHeatmap members={[makeMember({ assigned: 7 })]} />);
      expect(screen.getByText('14d')).toBeInTheDocument();
    });

    it('assigned=0 → "0d"가 표시된다', () => {
      render(<WorkloadHeatmap members={[makeMember({ assigned: 0 })]} />);
      expect(screen.getByText('0d')).toBeInTheDocument();
    });
  });

  describe('compact 모드', () => {
    it('compact=false (기본)이면 "역할" 헤더가 표시된다', () => {
      render(<WorkloadHeatmap members={[makeMember()]} />);
      expect(screen.getByText('역할')).toBeInTheDocument();
    });

    it('compact=true이면 "역할" 헤더가 없다', () => {
      render(<WorkloadHeatmap members={[makeMember()]} compact={true} />);
      expect(screen.queryByText('역할')).not.toBeInTheDocument();
    });

    it('compact=true이면 "할당" 헤더가 없다', () => {
      render(<WorkloadHeatmap members={[makeMember()]} compact={true} />);
      expect(screen.queryByText('할당')).not.toBeInTheDocument();
    });

    it('compact=true이면 "소화율" 헤더가 없다', () => {
      render(<WorkloadHeatmap members={[makeMember()]} compact={true} />);
      expect(screen.queryByText('소화율')).not.toBeInTheDocument();
    });

    it('compact=true이면 "부하" 헤더가 없다', () => {
      render(<WorkloadHeatmap members={[makeMember()]} compact={true} />);
      expect(screen.queryByText('부하')).not.toBeInTheDocument();
    });

    it('compact=true이어도 "멤버" 헤더와 상태 열(Todo·진행중·완료)은 표시된다', () => {
      render(<WorkloadHeatmap members={[makeMember()]} compact={true} />);
      expect(screen.getByText('멤버')).toBeInTheDocument();
      expect(screen.getByText('Todo')).toBeInTheDocument();
      expect(screen.getByText('진행중')).toBeInTheDocument();
      expect(screen.getByText('완료')).toBeInTheDocument();
    });
  });
});
