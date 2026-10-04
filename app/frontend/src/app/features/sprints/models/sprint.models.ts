/** Sprint tal como lo devuelve la API (`SprintResponse`); las fechas llegan en formato ISO `yyyy-MM-dd`. */
export interface Sprint {
  id: string;
  identification: string;
  startDate: string;
  endDate: string;
}

/** Payload de `POST /api/sprints` (contracts/sprints-api.openapi.yaml); fechas en `yyyy-MM-dd`. */
export interface CreateSprintRequest {
  identification: string;
  startDate: string;
  endDate: string;
}

/** `ProblemDetails` (RFC 7807) con el diccionario `errors` por campo. */
export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  errors?: Record<string, string[]>;
}

/** Elemento asignado a un Sprint (`SprintItemResponse` de `GET /api/sprints/{id}/items`): sin estado ni auditoría. */
export interface SprintItem {
  id: string;
  title: string;
  type: string;
  /** `null` cuando el elemento no tiene estimación informada (FR-018); no se convierte a 0. */
  devPoints: number | null;
  qaPoints: number | null;
}

/** Cuerpo de `POST /api/sprints/{id}/items` (`AssignItemRequest`). */
export interface AssignItemRequest {
  itemId: string;
}

/** Respuesta 201 de `POST /api/sprints/{id}/items` (`AssignedItemResponse`). */
export interface AssignedItem {
  sprintId: string;
  itemId: string;
}
