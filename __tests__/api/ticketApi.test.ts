import { ticketApi } from '@/client/api/ticketApi';
import type { BoardData, Ticket, CreateTicketInput, UpdateTicketInput, ReorderTicketInput } from '@/shared/types';

const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

const mockTicket: Ticket = {
  id: 1,
  title: '테스트 티켓',
  description: '설명',
  status: 'BACKLOG',
  priority: 'MEDIUM',
  position: -1024,
  plannedStartDate: null,
  dueDate: null,
  startedAt: null,
  completedAt: null,
  createdAt: new Date('2026-02-17'),
  updatedAt: new Date('2026-02-17'),
};

const mockBoardData: BoardData = {
  board: {
    BACKLOG: [],
    TODO: [],
    IN_PROGRESS: [],
    DONE: [],
  },
  total: 0,
};

describe('ticketApi', () => {
  // --- 성공 케이스 ---

  describe('getBoard', () => {
    it('GET /api/tickets를 호출하고 BoardData를 반환한다', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockBoardData),
      });

      const result = await ticketApi.getBoard();

      expect(mockFetch).toHaveBeenCalledWith('/api/tickets');
      expect(result).toEqual(mockBoardData);
    });
  });

  describe('create', () => {
    it('POST /api/tickets를 호출하고 생성된 Ticket을 반환한다', async () => {
      const input: CreateTicketInput = {
        title: '새 티켓',
        description: '설명',
        priority: 'HIGH',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTicket),
      });

      const result = await ticketApi.create(input);

      expect(mockFetch).toHaveBeenCalledWith('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      expect(result).toEqual(mockTicket);
    });
  });

  describe('update', () => {
    it('PATCH /api/tickets/:id를 호출하고 수정된 Ticket을 반환한다', async () => {
      const data: UpdateTicketInput = {
        title: '수정된 제목',
        priority: 'LOW',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ...mockTicket, ...data }),
      });

      const result = await ticketApi.update(1, data);

      expect(mockFetch).toHaveBeenCalledWith('/api/tickets/1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      expect(result).toEqual({ ...mockTicket, ...data });
    });
  });

  describe('remove', () => {
    it('DELETE /api/tickets/:id를 호출한다', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true });

      await ticketApi.remove(5);

      expect(mockFetch).toHaveBeenCalledWith('/api/tickets/5', {
        method: 'DELETE',
      });
    });
  });

  describe('reorder', () => {
    it('PATCH /api/tickets/reorder를 호출하고 결과를 반환한다', async () => {
      const input: ReorderTicketInput = {
        ticketId: 3,
        status: 'IN_PROGRESS',
        position: 0,
      };
      const mockResponse = {
        ticket: { ...mockTicket, id: 3, status: 'IN_PROGRESS', position: 0 },
        affected: [{ id: 5, position: 1024 }],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await ticketApi.reorder(input);

      expect(mockFetch).toHaveBeenCalledWith('/api/tickets/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('complete', () => {
    it('PATCH /api/tickets/:id/complete를 호출하고 완료된 Ticket을 반환한다', async () => {
      const completedTicket = { ...mockTicket, id: 3, status: 'DONE', completedAt: new Date() };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(completedTicket),
      });

      const result = await ticketApi.complete(3);

      expect(mockFetch).toHaveBeenCalledWith('/api/tickets/3/complete', {
        method: 'PATCH',
      });
      expect(result).toEqual(completedTicket);
    });
  });

  // --- 에러 케이스 ---

  describe('에러 처리', () => {
    it('getBoard 실패 시 에러 메시지를 throw한다', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: { message: '서버 오류' } }),
      });

      await expect(ticketApi.getBoard()).rejects.toThrow('서버 오류');
    });

    it('create 실패 시 에러 메시지를 throw한다', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: { message: '제목을 입력해주세요' } }),
      });

      await expect(ticketApi.create({ title: '' })).rejects.toThrow('제목을 입력해주세요');
    });

    it('update 실패 시 에러 메시지를 throw한다', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: { message: '티켓을 찾을 수 없습니다' } }),
      });

      await expect(ticketApi.update(999, { title: '수정' })).rejects.toThrow('티켓을 찾을 수 없습니다');
    });

    it('remove 실패 시 에러 메시지를 throw한다', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: { message: '티켓을 찾을 수 없습니다' } }),
      });

      await expect(ticketApi.remove(999)).rejects.toThrow('티켓을 찾을 수 없습니다');
    });

    it('complete 실패 시 에러 메시지를 throw한다', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: { message: '티켓을 찾을 수 없습니다' } }),
      });

      await expect(ticketApi.complete(999)).rejects.toThrow('티켓을 찾을 수 없습니다');
    });
  });
});
