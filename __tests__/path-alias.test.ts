import { describe, it, expect } from '@jest/globals';

// 경로 별칭 테스트
describe('경로 별칭 테스트', () => {
  it('@/shared 경로 별칭이 작동한다', async () => {
    const { TICKET_STATUS } = await import('@/shared/types');
    expect(TICKET_STATUS).toBeDefined();
  });

  it('@/shared/validations 경로 별칭이 작동한다', async () => {
    const { createTicketSchema } = await import('@/shared/validations/ticket');
    expect(createTicketSchema).toBeDefined();
  });

  it('@/server 경로 별칭이 작동한다 (mock)', async () => {
    const ticketService = await import('@/server/services/ticketService');
    expect(ticketService).toBeDefined();
  });
});
