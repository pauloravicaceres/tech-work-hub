export type BacklogItemType =
  | 'UserStory'
  | 'Bug'
  | 'TechEvolution'
  | 'TechRequirement'
  | 'TechDebt'
  | 'Research'
  | 'Spike';

export type BacklogItemPriority = 'Low' | 'Medium' | 'High' | 'Critical';

/** Payload de `POST /api/backlog/items` (contracts/api.md). */
export interface CreateBacklogItemRequest {
  title: string;
  description: string | null;
  type: BacklogItemType;
  priority: BacklogItemPriority;
  acceptanceCriteria: string | null;
  devPoints: number | null;
  qaPoints: number | null;
  applicationId: string | null;
}

export interface CreateBacklogItemResponse {
  id: string;
}

/** Aplicación registrada; `id` es el `Guid` real del módulo Application. */
export interface RegisteredApplication {
  id: string;
  name: string;
}

/** `ProblemDetails` (RFC 7807) con el diccionario `errors` por campo (FR-013). */
export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  errors?: Record<string, string[]>;
}
