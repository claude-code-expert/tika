export const POSITION_GAP = 1024;
export const REBALANCE_THRESHOLD = 2;
export const TITLE_MAX_LENGTH = 200;
export const DESCRIPTION_MAX_LENGTH = 1000;
export const CHECKLIST_MAX_ITEMS = 20;
export const LABEL_MAX_PER_TICKET = 5;
export const LABEL_MAX_PER_WORKSPACE = 20;
export const TICKET_MAX_PER_WORKSPACE = 300;

export const DEFAULT_LABELS = [
  { name: 'Frontend', color: '#2b7fff' },
  { name: 'Backend', color: '#00c950' },
  { name: 'Design', color: '#ad46ff' },
  { name: 'Bug', color: '#fb2c36' },
  { name: 'Docs', color: '#ffac6d' },
  { name: 'Infra', color: '#615fff' },
] as const;
