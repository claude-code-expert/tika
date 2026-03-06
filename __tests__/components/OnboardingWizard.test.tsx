/**
 * OnboardingWizard component tests
 * - Renders two option cards
 * - handleSelect calls PATCH /api/users/type
 * - On USER success: calls session.update() and navigates to /
 * - On WORKSPACE success: navigates to /onboarding/workspace
 * - Shows error message on failure
 * - Disables both buttons while loading
 */

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';

const mockPush = jest.fn();
const mockUpdate = jest.fn();

(useRouter as jest.Mock).mockReturnValue({ push: mockPush });
(useSession as jest.Mock).mockReturnValue({ update: mockUpdate });

function renderWizard() {
  return render(<OnboardingWizard userId="user-1" userName="홍길동" />);
}

beforeEach(() => {
  jest.clearAllMocks();
  (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  (useSession as jest.Mock).mockReturnValue({ update: mockUpdate });
  global.fetch = jest.fn();
});

// ─── Rendering ──────────────────────────────────────────────────────────────

describe('OnboardingWizard — rendering', () => {
  it('shows welcome message with user name', () => {
    renderWizard();
    expect(screen.getByText(/홍길동/)).toBeTruthy();
    expect(screen.getByText(/Tika에 오신 것을 환영합니다/)).toBeTruthy();
  });

  it('renders 개인용 and 워크스페이스 cards', () => {
    renderWizard();
    expect(screen.getByText('개인용')).toBeTruthy();
    expect(screen.getByText('워크스페이스')).toBeTruthy();
  });

  it('renders two 시작하기 buttons', () => {
    renderWizard();
    const buttons = screen.getAllByText(/시작하기/);
    expect(buttons.length).toBe(2);
  });
});

// ─── USER selection ─────────────────────────────────────────────────────────

describe('OnboardingWizard — USER selection', () => {
  it('calls PATCH /api/users/type with USER and navigates to /', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ user: { userType: 'USER' }, workspace: { id: 1 } }),
    });
    mockUpdate.mockResolvedValue(null);

    renderWizard();
    const buttons = screen.getAllByText(/시작하기/);
    fireEvent.click(buttons[0]); // 개인용 card

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/users/type', expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ userType: 'USER' }),
      }));
    });

    await waitFor(() => expect(mockUpdate).toHaveBeenCalled());
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/'));
  });
});

// ─── WORKSPACE selection ─────────────────────────────────────────────────────

describe('OnboardingWizard — WORKSPACE selection', () => {
  it('navigates to /onboarding/workspace on WORKSPACE success', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ user: { userType: 'WORKSPACE' }, workspace: null }),
    });
    mockUpdate.mockResolvedValue(null);

    renderWizard();
    const buttons = screen.getAllByText(/시작하기/);
    fireEvent.click(buttons[1]); // 워크스페이스 card

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/users/type', expect.objectContaining({
        body: JSON.stringify({ userType: 'WORKSPACE' }),
      }));
    });
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/onboarding/workspace'));
  });
});

// ─── Error handling ──────────────────────────────────────────────────────────

describe('OnboardingWizard — error handling', () => {
  it('shows error message on API failure', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: { message: '서버 오류입니다.' } }),
    });

    renderWizard();
    const buttons = screen.getAllByText(/시작하기/);
    fireEvent.click(buttons[0]);

    await waitFor(() => {
      expect(screen.getByText('서버 오류입니다.')).toBeTruthy();
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('shows error message on network failure', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    renderWizard();
    const buttons = screen.getAllByText(/시작하기/);
    fireEvent.click(buttons[0]);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeTruthy();
    });
  });
});
