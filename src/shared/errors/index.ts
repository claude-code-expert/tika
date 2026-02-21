export class TicketNotFoundError extends Error {
  constructor(id: number) {
    super(`티켓을 찾을 수 없습니다`);
    this.name = 'TicketNotFoundError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
