import { render, screen } from '@testing-library/react';
import { describe, it, expect } from '@jest/globals';

// 간단한 테스트 컴포넌트
function TestComponent() {
  return <div>Hello Test</div>;
}

describe('Jest 환경 테스트', () => {
  it('@testing-library/react가 정상 작동한다', () => {
    render(<TestComponent />);
    expect(screen.getByText('Hello Test')).toBeInTheDocument();
  });

  it('@testing-library/jest-dom 매처가 작동한다', () => {
    render(<TestComponent />);
    const element = screen.getByText('Hello Test');
    expect(element).toBeVisible();
  });

  it('TypeScript strict 모드가 적용된다', () => {
    // 타입 체크 테스트 - 컴파일 시점에 확인됨
    const value: string = 'test';
    expect(value).toBe('test');
  });
});
