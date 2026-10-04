import { BacklogItemPriority, BacklogItemType } from './backlog-item.models';

export const BACKLOG_ITEM_TYPES: readonly BacklogItemType[] = [
  'UserStory',
  'Bug',
  'TechEvolution',
  'TechRequirement',
  'TechDebt',
  'Research',
  'Spike',
];

/** Tipos técnicos: no admiten `qaPoints` (FR-008). Única fuente de verdad en el cliente. */
export const TECHNICAL_BACKLOG_ITEM_TYPES: readonly BacklogItemType[] = [
  'TechEvolution',
  'TechRequirement',
  'TechDebt',
  'Research',
  'Spike',
];

export const BACKLOG_ITEM_PRIORITIES: readonly BacklogItemPriority[] = ['Low', 'Medium', 'High', 'Critical'];

export const isTechnicalType = (type: BacklogItemType): boolean => TECHNICAL_BACKLOG_ITEM_TYPES.includes(type);
